import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyMenusApi, ordersApi, userPackagesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/useToast";
import {
  Clock,
  UtensilsCrossed,
  Package,
  AlertCircle,
  Check,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { MenuItem, DailyMenu, PackageType } from "@/types";

export default function OrderPage() {
  const queryClient = useQueryClient();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  // Ghi chú cho từng món: { menuItemId: note }
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  // Tab đặt cơm: có cơm hoặc không cơm
  const [orderType, setOrderType] = useState<PackageType>("normal");

  const { data: todayMenus, isLoading: menuLoading } = useQuery({
    queryKey: ["todayMenu"],
    queryFn: () => dailyMenusApi.getTodayMenu(),
  });

  const { data: myOrder } = useQuery({
    queryKey: ["myTodayOrder"],
    queryFn: () => ordersApi.getMyTodayOrder(),
  });

  const { data: activePackages } = useQuery({
    queryKey: ["myActivePackages"],
    queryFn: () => userPackagesApi.getMyActivePackages(),
  });

  const createOrderMutation = useMutation({
    mutationFn: ({
      items,
      type,
    }: {
      items: Array<{ menuItemId: string; note?: string }>;
      type: PackageType;
    }) => ordersApi.createOrder(items, type),
    onSuccess: (response) => {
      toast({
        title: "✅ Đặt cơm thành công!",
        description: response.data.message,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["myTodayOrder"] });
      queryClient.invalidateQueries({ queryKey: ["myActivePackages"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Đặt cơm thất bại",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const menus = todayMenus?.data.data || [];
  const order = myOrder?.data.data;
  const packages = activePackages?.data.data || [];
  const hasActivePackage = packages.length > 0;

  // Tính số lượt còn lại theo loại gói
  const normalPackages = packages.filter(
    (pkg) => pkg.packageType === "normal" || !pkg.packageType,
  );
  const noRicePackages = packages.filter(
    (pkg) => pkg.packageType === "no-rice",
  );

  const normalTurns = normalPackages.reduce(
    (sum, pkg) => sum + (pkg.remainingTurns || 0),
    0,
  );
  const noRiceTurns = noRicePackages.reduce(
    (sum, pkg) => sum + (pkg.remainingTurns || 0),
    0,
  );

  // Số lượt của loại gói đang chọn
  const remainingTurns = orderType === "normal" ? normalTurns : noRiceTurns;

  // Set active menu to first one if not set
  const currentMenu =
    menus.find((m: DailyMenu) => m._id === activeMenuId) ||
    (menus as DailyMenu[])[0];

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        // Xóa món và ghi chú
        const newNotes = { ...itemNotes };
        delete newNotes[itemId];
        setItemNotes(newNotes);
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setItemNotes((prev) => ({
      ...prev,
      [itemId]: note,
    }));
  };

  const handleTabChange = (value: string) => {
    setOrderType(value as PackageType);
    // Reset selection khi đổi tab
    setSelectedItems([]);
    setItemNotes({});
  };

  const handleSubmitOrder = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "⚠️ Chưa chọn món",
        description: "Vui lòng chọn ít nhất 1 món ăn",
        variant: "destructive",
      });
      return;
    }
    // Tạo mảng items với menuItemId và note
    const items = selectedItems.map((itemId) => ({
      menuItemId: itemId,
      note: itemNotes[itemId] || "",
    }));
    createOrderMutation.mutate({ items, type: orderType });
  };

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">🍽️</div>
          <p className="text-gray-500">Đang tải menu...</p>
        </div>
      </div>
    );
  }

  if (!hasActivePackage) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold mb-2">Chưa có gói đặt cơm</h2>
            <p className="text-gray-500 mb-4">
              Bạn cần mua gói đặt cơm trước khi có thể đặt món
            </p>
            <Link to="/packages">
              <Button>Mua gói ngay</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!menus || menus.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold mb-2">Chưa có menu hôm nay</h2>
            <p className="text-gray-500">
              Vui lòng quay lại sau khi menu được cập nhật
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Nếu đã đặt cơm rồi
  if (order) {
    const isNoRice = order.orderType === "no-rice";
    return (
      <Card className="max-w-md mx-auto text-center">
        <CardContent className="pt-6">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2 text-green-600">
            Bạn đã đặt cơm hôm nay!
          </h2>
          {/* Badge loại đặt */}
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                isNoRice
                  ? "bg-blue-100 text-blue-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {isNoRice ? "🥢 Không cơm" : "🍚 Có cơm"}
            </span>
          </div>
          <p className="text-gray-500 mb-2">
            Món đã chọn ({order.orderItems?.length || 0} món):
          </p>
          <div className="mt-4 text-left space-y-2">
            {order.orderItems?.map((item) => (
              <div key={item._id} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                <div>
                  <span className="font-medium">
                    {(item.menuItemId as MenuItem).name}
                  </span>
                  {item.note && (
                    <p className="text-sm text-gray-500 italic">
                      📝 {item.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentMenu) return null;

  // Kiểm tra menu bị khóa hoặc ngoài thời gian
  const isLocked = currentMenu.isLocked;
  // Tính toán xem có trong khoảng thời gian không
  const now = new Date();
  const [beginHour, beginMin] = currentMenu.beginAt.split(":").map(Number);
  const [endHour, endMin] = currentMenu.endAt.split(":").map(Number);
  const beginTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    beginHour,
    beginMin,
  );
  const endTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    endHour,
    endMin,
  );
  const isOutsideTime = now < beginTime || now > endTime;
  const canOrder = !isLocked && !isOutsideTime;

  // Group items by category
  const groupedItems: Record<string, MenuItem[]> = {};
  currentMenu.menuItems?.forEach((item) => {
    const category = item.category || "other";
    if (!groupedItems[category]) groupedItems[category] = [];
    groupedItems[category].push(item);
  });

  const categoryLabels: Record<string, string> = {
    new: "☆ Món mới",
    daily: "▪︎ Món mỗi ngày",
    special: "★ Món đặc biệt",
    other: "Món khác",
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Menu Selector - chỉ hiện nếu có nhiều hơn 1 menu */}
      {menus.length > 1 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Chọn menu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(menus as DailyMenu[]).map((menu, index) => (
                <Button
                  key={menu._id}
                  variant={currentMenu._id === menu._id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setActiveMenuId(menu._id);
                    setSelectedItems([]);
                    setItemNotes({});
                  }}
                >
                  Menu {index + 1} ({menu.beginAt} - {menu.endAt})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="text-orange-500" />
            Menu hôm nay{" "}
            {menus.length > 1 &&
              `(${(menus as DailyMenu[]).findIndex((m) => m._id === currentMenu._id) + 1}/${menus.length})`}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Thời gian đặt: {currentMenu.beginAt} - {currentMenu.endAt}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabs chọn loại đặt cơm */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Tabs value={orderType} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="normal" className="gap-2">
                🍚 Có cơm
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {normalTurns} lượt
                </span>
              </TabsTrigger>
              <TabsTrigger value="no-rice" className="gap-2">
                🥢 Không cơm
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {noRiceTurns} lượt
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="normal" className="mt-4">
              <p className="text-sm text-gray-600">
                Đặt món kèm cơm trắng (30,000đ/phần). Sử dụng gói{" "}
                <strong>bình thường</strong>.
              </p>
            </TabsContent>
            <TabsContent value="no-rice" className="mt-4">
              <p className="text-sm text-gray-600">
                Chỉ đặt món ăn, không lấy cơm (20,000đ/phần). Sử dụng gói{" "}
                <strong>không cơm</strong>.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Warning nếu không có gói phù hợp */}
      {remainingTurns === 0 && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="text-yellow-600 w-5 h-5" />
            <div>
              <p className="text-yellow-800">
                Bạn chưa có gói{" "}
                <strong>
                  {orderType === "normal"
                    ? "bình thường (có cơm)"
                    : "không cơm"}
                </strong>{" "}
                khả dụng.
              </p>
              <Link
                to="/packages"
                className="text-sm text-orange-600 hover:underline"
              >
                → Mua gói ngay
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!canOrder && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="text-yellow-600 w-5 h-5" />
            <p className="text-yellow-800">
              {isLocked
                ? "Menu đã bị khóa, không thể đặt cơm"
                : `Ngoài thời gian đặt cơm (${currentMenu.beginAt} - ${currentMenu.endAt})`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Menu Items */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {categoryLabels[category] || category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => {
                  const isSelected = selectedItems.includes(item._id);
                  const isDisabled = !canOrder || remainingTurns === 0;
                  return (
                    <div
                      key={item._id}
                      className={`rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-orange-50 border-orange-300"
                          : "hover:bg-gray-50"
                      } ${isDisabled ? "opacity-50" : ""}`}
                    >
                      <label
                        className={`flex items-center gap-3 p-3 cursor-pointer ${
                          isDisabled ? "pointer-events-none" : ""
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleItem(item._id)}
                          disabled={isDisabled}
                        />
                        <span className="flex-1 font-medium">{item.name}</span>
                      </label>

                      {/* Input ghi chú khi đã chọn món */}
                      {isSelected && (
                        <div className="px-3 pb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <MessageSquare className="w-3 h-3" />
                            Ghi chú (VD: lấy phần đuôi, không cay...)
                          </div>
                          <input
                            type="text"
                            placeholder="Nhập ghi chú cho món này..."
                            value={itemNotes[item._id] || ""}
                            onChange={(e) =>
                              handleNoteChange(item._id, e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            maxLength={200}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mt-6 sticky bottom-4">
        <Card className="shadow-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Đã chọn: {selectedItems.length} món</p>
              <p className="text-sm text-gray-500">
                {orderType === "normal" ? "🍚 Có cơm" : "🥢 Không cơm"} • Còn{" "}
                {remainingTurns} lượt
              </p>
              {selectedItems.length > remainingTurns && (
                <p className="text-sm text-red-500 font-medium">
                  ⚠️ Vượt quá số lượt còn lại!
                </p>
              )}
            </div>
            <Button
              size="lg"
              onClick={handleSubmitOrder}
              disabled={
                !canOrder ||
                selectedItems.length === 0 ||
                selectedItems.length > remainingTurns ||
                remainingTurns === 0 ||
                createOrderMutation.isPending
              }
            >
              {createOrderMutation.isPending ? "Đang xử lý..." : "Đặt cơm"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
