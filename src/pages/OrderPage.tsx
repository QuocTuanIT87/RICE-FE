import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyMenusApi, ordersApi, userPackagesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import {
  UtensilsCrossed,
  Package,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ShoppingBag,
  Loader2,
  Zap,
  Lock,
  Timer,
  Minus,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { MenuItem, DailyMenu, PackageType } from "@/types";
import { useSocket } from "@/contexts/SocketContext";

export default function OrderPage() {
  const queryClient = useQueryClient();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>(
    {},
  );
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [orderType, setOrderType] = useState<PackageType>("normal");
  const { socket } = useSocket();

  const { data: todayMenus, isLoading: menuLoading } = useQuery({
    queryKey: ["todayMenu"],
    queryFn: () => dailyMenusApi.getTodayMenu(),
  });

  useEffect(() => {
    if (!socket) return;
    const handleMenuCreated = () => {
      queryClient.invalidateQueries({ queryKey: ["todayMenu"] });
      toast({
        title: "📢 Menu mới!",
        description: "Admin vừa cập nhật thực đơn mới. Hãy xem ngay!",
      });
    };
    const handleMenuLocked = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["todayMenu"] });
      toast({
        title: "🔒 Menu đã đóng",
        description: data.message || "Thời gian đặt cơm đã kết thúc.",
        variant: "destructive",
      });
    };
    const handleMenuUnlocked = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["todayMenu"] });
      toast({
        title: "🔓 Menu đã mở",
        description: data.message || "Bạn đã có thể đặt cơm lại.",
        variant: "success",
      });
    };
    socket.on("menu_created", handleMenuCreated);
    socket.on("menu_locked", handleMenuLocked);
    socket.on("menu_unlocked", handleMenuUnlocked);
    return () => {
      socket.off("menu_created", handleMenuCreated);
      socket.off("menu_locked", handleMenuLocked);
      socket.off("menu_unlocked", handleMenuUnlocked);
    };
  }, [socket, queryClient]);

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
      menuId,
    }: {
      items: Array<{ menuItemId: string; note?: string; quantity?: number }>;
      type: PackageType;
      menuId: string;
    }) => ordersApi.createOrder(items, type, menuId),
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
  const remainingTurns = orderType === "normal" ? normalTurns : noRiceTurns;

  // Tính tổng số lượng đã chọn
  const selectedItemIds = Object.keys(itemQuantities).filter(
    (id) => itemQuantities[id] > 0,
  );
  const totalQuantity = Object.values(itemQuantities).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  const currentMenu =
    menus.find((m: DailyMenu) => m._id === activeMenuId) ||
    (menus as DailyMenu[])[0];

  const handleIncrement = (itemId: string) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleDecrement = (itemId: string) => {
    setItemQuantities((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        // Xóa item khỏi danh sách
        const newQuantities = { ...prev };
        delete newQuantities[itemId];
        const newNotes = { ...itemNotes };
        delete newNotes[itemId];
        setItemNotes(newNotes);
        return newQuantities;
      }
      return { ...prev, [itemId]: current - 1 };
    });
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setItemNotes((prev) => ({ ...prev, [itemId]: note }));
  };

  const handleTabChange = (value: PackageType) => {
    setOrderType(value);
    setItemQuantities({});
    setItemNotes({});
  };

  const handleSubmitOrder = () => {
    if (selectedItemIds.length === 0) {
      toast({
        title: "⚠️ Chưa chọn món",
        description: "Vui lòng chọn ít nhất 1 món ăn",
        variant: "destructive",
      });
      return;
    }
    const items = selectedItemIds.map((itemId) => ({
      menuItemId: itemId,
      note: itemNotes[itemId] || "",
      quantity: itemQuantities[itemId] || 1,
    }));
    createOrderMutation.mutate({
      items,
      type: orderType,
      menuId: currentMenu._id,
    });
  };

  // ========== LOADING ==========
  if (menuLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Đang tải menu...</p>
        </div>
      </div>
    );
  }

  // ========== NO PACKAGE ==========
  if (!hasActivePackage) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
          <Package size={36} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">
          Chưa có gói đặt cơm
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Bạn cần mua gói đặt cơm trước khi có thể đặt món
        </p>
        <Link to="/packages">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold gap-2">
            <ShoppingBag size={16} />
            Mua gói ngay
          </Button>
        </Link>
      </div>
    );
  }

  // ========== NO MENU ==========
  if (!menus || menus.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
          <UtensilsCrossed size={36} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">
          Chưa có menu hôm nay
        </h2>
        <p className="text-gray-500 text-sm">
          Vui lòng quay lại sau khi menu được cập nhật
        </p>
      </div>
    );
  }

  // ========== ALREADY ORDERED ==========
  if (order) {
    const isNoRice = order.orderType === "no-rice";
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 overflow-hidden">
          <div className="text-center pt-8 pb-4">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-black text-emerald-700 mb-2">
              Bạn đã đặt cơm hôm nay!
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold ${
                isNoRice
                  ? "bg-blue-100 text-blue-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {isNoRice ? "🥢 Không cơm" : "🍚 Có cơm"}
            </span>
          </div>

          <div className="px-6 pb-6">
            <p className="text-sm text-gray-500 mb-3 font-medium">
              Món đã chọn ({order.orderItems?.length || 0} món):
            </p>
            <div className="space-y-2">
              {order.orderItems?.map((item: any) => (
                <div
                  key={item._id}
                  className="flex items-start gap-3 p-3 bg-white rounded-xl border border-emerald-100"
                >
                  <CheckCircle2
                    size={16}
                    className="text-emerald-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-gray-900 text-sm">
                      {(item.menuItemId as MenuItem)?.name || "Món đã bị xóa"}
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-orange-500 ml-1">
                          ×{item.quantity}
                        </span>
                      )}
                    </span>
                    {item.note && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        📝 {item.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentMenu) return null;

  // ========== ORDER FORM ==========
  const isLocked = currentMenu.isLocked;
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

  const groupedItems: Record<string, MenuItem[]> = {};
  currentMenu.menuItems?.forEach((item) => {
    const category = item.category || "other";
    if (!groupedItems[category]) groupedItems[category] = [];
    groupedItems[category].push(item);
  });

  const categoryLabels: Record<string, { label: string; icon: string }> = {
    new: { label: "Món mới", icon: "✨" },
    daily: { label: "Món mỗi ngày", icon: "🍽️" },
    special: { label: "Món đặc biệt", icon: "⭐" },
    other: { label: "Món khác", icon: "🍲" },
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-1">
          Đặt cơm
        </p>
        <h1 className="text-2xl font-black text-gray-900">Menu hôm nay</h1>
      </div>

      {/* Menu Selector */}
      {menus.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {(menus as DailyMenu[]).map((menu, index) => (
            <button
              key={menu._id}
              onClick={() => {
                setActiveMenuId(menu._id);
                setItemQuantities({});
                setItemNotes({});
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                currentMenu._id === menu._id
                  ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"
              }`}
            >
              Menu {index + 1} ({menu.beginAt} - {menu.endAt})
            </button>
          ))}
        </div>
      )}

      {/* Time Info */}
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white border border-gray-100">
        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
          <Timer size={20} className="text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">
            Thời gian đặt: {currentMenu.beginAt} - {currentMenu.endAt}
          </p>
          <p className="text-xs text-gray-400">
            {canOrder
              ? "✅ Đang trong thời gian đặt cơm"
              : "⛔ Ngoài thời gian đặt"}
          </p>
        </div>
      </div>

      {/* Order Type Toggle */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="grid grid-cols-2">
          <button
            onClick={() => handleTabChange("normal")}
            className={`py-4 text-center transition-all relative ${
              orderType === "normal"
                ? "bg-orange-50 text-orange-700"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span className="text-lg">🍚</span>
            <p className="text-sm font-bold mt-1">Có cơm</p>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                orderType === "normal"
                  ? "bg-orange-200 text-orange-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {normalTurns} lượt
            </span>
            {orderType === "normal" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("no-rice")}
            className={`py-4 text-center transition-all relative ${
              orderType === "no-rice"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span className="text-lg">🥢</span>
            <p className="text-sm font-bold mt-1">Không cơm</p>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                orderType === "no-rice"
                  ? "bg-blue-200 text-blue-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {noRiceTurns} lượt
            </span>
            {orderType === "no-rice" && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-500 rounded-full" />
            )}
          </button>
        </div>
        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            {orderType === "normal"
              ? "Đặt món kèm cơm trắng (30,000đ/phần). Sử dụng gói bình thường."
              : "Chỉ đặt món ăn, không lấy cơm (20,000đ/phần). Sử dụng gói không cơm."}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {remainingTurns === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">
              Bạn chưa có gói{" "}
              <strong>
                {orderType === "normal" ? "bình thường (có cơm)" : "không cơm"}
              </strong>{" "}
              khả dụng.
            </p>
            <Link
              to="/packages"
              className="text-xs text-orange-600 hover:underline font-bold"
            >
              → Mua gói ngay
            </Link>
          </div>
        </div>
      )}

      {!canOrder && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <Lock size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {isLocked
              ? "Menu đã bị khóa, không thể đặt cơm"
              : `Ngoài thời gian đặt cơm (${currentMenu.beginAt} - ${currentMenu.endAt})`}
          </p>
        </div>
      )}

      {/* ========= MENU ITEMS ========= */}
      <div className="space-y-4">
        {Object.entries(groupedItems).map(([category, items]) => {
          const cat = categoryLabels[category] || {
            label: category,
            icon: "🍲",
          };
          return (
            <div
              key={category}
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
            >
              {/* Category header */}
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-sm">
                  {cat.icon} {cat.label}
                  <span className="text-gray-400 font-medium ml-2">
                    ({items.length})
                  </span>
                </h3>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-50">
                {items.map((item) => {
                  const qty = itemQuantities[item._id] || 0;
                  const isSelected = qty > 0;
                  const isDisabled = !canOrder || remainingTurns === 0;
                  const accentColor =
                    orderType === "normal" ? "orange" : "blue";

                  return (
                    <div
                      key={item._id}
                      className={`transition-colors ${
                        isSelected
                          ? `bg-${accentColor}-50/50`
                          : "hover:bg-gray-50/50"
                      } ${isDisabled ? "opacity-50" : ""}`}
                    >
                      <div
                        className={`flex items-center gap-3 px-5 py-3.5 ${
                          isDisabled ? "pointer-events-none" : ""
                        }`}
                      >
                        {/* Tên món */}
                        <span
                          className={`flex-1 text-sm ${
                            isSelected
                              ? `font-bold text-${accentColor}-700`
                              : "font-medium text-gray-700"
                          }`}
                        >
                          {item.name}
                        </span>

                        {/* Nút +/- */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isSelected && (
                            <button
                              type="button"
                              onClick={() => handleDecrement(item._id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-${accentColor}-100 text-${accentColor}-600 hover:bg-${accentColor}-200`}
                            >
                              <Minus size={14} />
                            </button>
                          )}
                          {isSelected && (
                            <span
                              className={`w-8 text-center text-sm font-bold text-${accentColor}-700`}
                            >
                              {qty}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleIncrement(item._id)}
                            disabled={isDisabled}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              isSelected
                                ? `bg-${accentColor}-500 text-white hover:bg-${accentColor}-600`
                                : `bg-${accentColor}-100 text-${accentColor}-500 hover:bg-${accentColor}-200 hover:text-${accentColor}-600`
                            }`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Note input */}
                      {isSelected && (
                        <div className="px-5 pb-3.5 pl-5">
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1.5">
                            <MessageSquare size={10} />
                            Ghi chú (VD: lấy phần đuôi, không cay...)
                          </div>
                          <input
                            type="text"
                            placeholder="Nhập ghi chú cho món này..."
                            value={itemNotes[item._id] || ""}
                            onChange={(e) =>
                              handleNoteChange(item._id, e.target.value)
                            }
                            className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-${accentColor}-300 focus:border-${accentColor}-400 bg-white`}
                            maxLength={200}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========= STICKY SUBMIT ========= */}
      <div className="sticky bottom-4 z-20">
        <div className="rounded-2xl bg-white border border-gray-200 shadow-xl shadow-gray-200/50 p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm">
              {totalQuantity > 0
                ? `Đã chọn ${totalQuantity} phần (${selectedItemIds.length} món)`
                : "Chưa chọn món nào"}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              {orderType === "normal" ? "🍚 Có cơm" : "🥢 Không cơm"} •{" "}
              <span className="font-bold">Còn {remainingTurns} lượt</span>
            </p>
            {totalQuantity > remainingTurns && (
              <p className="text-xs text-red-500 font-bold mt-0.5">
                ⚠️ Vượt quá số lượt còn lại!
              </p>
            )}
          </div>
          <Button
            onClick={handleSubmitOrder}
            disabled={
              !canOrder ||
              totalQuantity === 0 ||
              totalQuantity > remainingTurns ||
              remainingTurns === 0 ||
              createOrderMutation.isPending
            }
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold px-6 h-12 shadow-lg shadow-orange-200 shrink-0 gap-2"
          >
            {createOrderMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Zap size={16} />
                Đặt cơm
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
