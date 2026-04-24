import { Button } from "@/components/ui/button";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { dailyMenusApi, ordersApi, userPackagesApi } from "@/services/api";
import type { DailyMenu, MenuItem, PackageType } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  Lock,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Timer,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function OrderPage() {
  const queryClient = useQueryClient();
  const hasPrefilled = useRef<string | null>(null);
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
    queryKey: ["myTodayOrder", activeMenuId],
    queryFn: () => ordersApi.getMyTodayOrder(activeMenuId || undefined),
  });

  const { data: activePackages } = useQuery({
    queryKey: ["myActivePackages"],
    queryFn: () => userPackagesApi.getMyActivePackages(),
  });

  const menus = todayMenus?.data.data || [];
  const order = myOrder?.data.data;
  const packages = activePackages?.data.data || [];
  const hasActivePackage = packages.length > 0;

  // Tự động điền dữ liệu từ đơn hàng cũ nếu có và chưa confirmed
  useEffect(() => {
    // Chỉ nạp dữ liệu một lần cho mỗi đơn hàng (dựa trên ID đơn hàng)
    if (order && !order.isConfirmed && hasPrefilled.current !== order._id) {
      setOrderType(order.orderType || "normal");

      const quantities: Record<string, number> = {};
      const notes: Record<string, string> = {};

      order.orderItems?.forEach((item: any) => {
        const itemId =
          typeof item.menuItemId === "object"
            ? item.menuItemId._id
            : item.menuItemId;
        if (itemId) {
          quantities[itemId] = item.quantity || 1;
          notes[itemId] = item.note || "";
        }
      });

      setItemQuantities(quantities);
      setItemNotes(notes);

      // Xử lý menuId (có thể là object hoặc string)
      const menuId =
        typeof order.dailyMenuId === "object"
          ? order.dailyMenuId._id
          : order.dailyMenuId;
      if (menuId && menuId !== activeMenuId) {
        setActiveMenuId(menuId);
      }

      hasPrefilled.current = order._id;
    } else if (!order) {
      hasPrefilled.current = null;
    }
  }, [order, activeMenuId]);

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

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => ordersApi.deleteOrder(id),
    onSuccess: (response) => {
      toast({
        title: "🗑️ Đã hủy đơn cơm",
        description: response.data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["myTodayOrder"] });
      queryClient.invalidateQueries({ queryKey: ["myActivePackages"] });
      // Reset form
      setItemQuantities({});
      setItemNotes({});
    },
    onError: (error: any) => {
      toast({
        title: "❌ Hủy đơn thất bại",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

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

  // Lưu ý: Trong hệ thống này, lượt chỉ được trừ khi Admin duyệt (Confirm).
  // Vì vậy remainingTurns từ server đã bao gồm cả lượt của đơn hiện tại (nếu chưa duyệt).
  // Ta không cần cộng dồn thêm để tránh sai lệch.
  const totalEffectiveTurns = remainingTurns;

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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ===================== COMPACT HEADER ===================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <Zap size={10} className="fill-orange-600" />
            Thực đơn hôm nay
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Đặt cơm trực tuyến
          </h1>
        </div>

        {/* Menu Switcher (Compact) */}
        {menus.length > 1 && (
          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
            {(menus as DailyMenu[]).map((menu, index) => (
              <button
                key={menu._id}
                onClick={() => {
                  setActiveMenuId(menu._id);
                  setItemQuantities({});
                  setItemNotes({});
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                  currentMenu._id === menu._id
                    ? "bg-white text-orange-600 shadow-sm border border-orange-100"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                Menu {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
        {/* ===================== LEFT COLUMN: MENU ===================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Info Bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <Timer size={16} className="text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">
                  Giờ đặt
                </p>
                <p className="text-xs font-black text-gray-900 truncate">
                  {currentMenu.beginAt} - {currentMenu.endAt}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "p-3 rounded-2xl border shadow-sm flex items-center gap-3",
                canOrder
                  ? "bg-emerald-50/50 border-emerald-100"
                  : "bg-red-50/50 border-red-100",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm",
                  canOrder ? "text-emerald-500" : "text-red-500",
                )}
              >
                {canOrder ? <CheckCircle2 size={16} /> : <Lock size={16} />}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold opacity-60 uppercase leading-none mb-1">
                  Trạng thái
                </p>
                <p
                  className={cn(
                    "text-xs font-black uppercase truncate",
                    canOrder ? "text-emerald-700" : "text-red-700",
                  )}
                >
                  {canOrder ? "Mở cửa" : "Đã đóng"}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "p-3 rounded-2xl border shadow-sm flex items-center gap-3 col-span-2 md:col-span-1",
                orderType === "normal"
                  ? "bg-orange-50/50 border-orange-100"
                  : "bg-blue-50/50 border-blue-100",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm",
                  orderType === "normal" ? "text-orange-500" : "text-blue-500",
                )}
              >
                <Package size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold opacity-60 uppercase leading-none mb-1">
                  Lượt khả dụng
                </p>
                <p
                  className={cn(
                    "text-xs font-black truncate",
                    orderType === "normal"
                      ? "text-orange-700"
                      : "text-blue-700",
                  )}
                >
                  {totalEffectiveTurns} lượt
                </p>
              </div>
            </div>
          </div>

          {/* Order Type Tabs (Compact) */}
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center max-w-sm">
            <button
              onClick={() => handleTabChange("normal")}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs transition-all",
                orderType === "normal"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-400",
              )}
            >
              <span>🍚</span> Có cơm
            </button>
            <button
              onClick={() => handleTabChange("no-rice")}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs transition-all",
                orderType === "no-rice"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-400",
              )}
            >
              <span>🥢</span> Không cơm
            </button>
          </div>

          {/* ========= MENU SECTIONS ========= */}
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => {
              const cat = categoryLabels[category] || {
                label: category,
                icon: "🍲",
              };
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xl">{cat.icon}</span>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                      {cat.label}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-300 ml-auto">
                      {items.length} món
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((item) => {
                      const qty = itemQuantities[item._id] || 0;
                      const isSelected = qty > 0;
                      const isDisabled =
                        !canOrder ||
                        (qty === 0 && totalQuantity >= totalEffectiveTurns) ||
                        order?.isConfirmed;
                      const accentColor =
                        orderType === "normal" ? "orange" : "blue";

                      return (
                        <div
                          key={item._id}
                          className={cn(
                            "group bg-white rounded-2xl border transition-all duration-300 overflow-hidden",
                            isSelected
                              ? `border-${accentColor}-300 bg-${accentColor}-50/10`
                              : "border-gray-100 hover:border-gray-200 shadow-sm",
                            isDisabled && qty === 0
                              ? "opacity-50 grayscale"
                              : "",
                          )}
                        >
                          <div className="p-4">
                            <div className="flex justify-between items-start gap-3">
                              <span
                                className={cn(
                                  "text-sm leading-snug transition-all",
                                  isSelected
                                    ? `font-black text-${accentColor}-700`
                                    : "font-bold text-gray-700",
                                )}
                              >
                                {item.name}
                              </span>

                              <div className="flex items-center gap-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                                {isSelected && (
                                  <button
                                    onClick={() => handleDecrement(item._id)}
                                    className="w-6 h-6 rounded-md bg-white text-gray-400 hover:text-red-500 flex items-center justify-center transition-all shadow-sm"
                                  >
                                    <Minus size={12} strokeWidth={3} />
                                  </button>
                                )}
                                {isSelected && (
                                  <span className="w-6 text-center text-[11px] font-black text-gray-900">
                                    {qty}
                                  </span>
                                )}
                                <button
                                  onClick={() => handleIncrement(item._id)}
                                  disabled={isDisabled}
                                  className={cn(
                                    "w-6 h-6 rounded-md flex items-center justify-center transition-all shadow-sm",
                                    isSelected
                                      ? `bg-${accentColor}-500 text-white`
                                      : "bg-white text-gray-400 hover:text-orange-500",
                                  )}
                                >
                                  <Plus size={12} strokeWidth={3} />
                                </button>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="mt-3 animate-in fade-in duration-300">
                                <input
                                  type="text"
                                  placeholder="Ghi chú món..."
                                  value={itemNotes[item._id] || ""}
                                  onChange={(e) =>
                                    handleNoteChange(item._id, e.target.value)
                                  }
                                  className="w-full px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-200"
                                  maxLength={100}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================== RIGHT COLUMN: SIDEBAR ===================== */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-5">
            {/* 1. SELECTION BOX (Compact) */}
            {totalQuantity > 0 && (!order || !order.isConfirmed) && (
              <div className="bg-white rounded-3xl border-2 border-orange-500 shadow-xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 uppercase">
                      Đơn của bạn
                    </h3>
                    <span className="bg-orange-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">
                      {totalQuantity} PHẦN
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {selectedItemIds.map((id) => {
                      const item = currentMenu.menuItems?.find(
                        (mi) => mi._id === id,
                      );
                      return (
                        <div
                          key={id}
                          className="flex justify-between items-start gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">
                              {item?.name}
                            </p>
                            {itemNotes[id] && (
                              <p className="text-[9px] text-gray-400 mt-0.5 italic leading-tight">
                                "{itemNotes[id]}"
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-black text-orange-600 shrink-0">
                            ×{itemQuantities[id]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-gray-50 space-y-3">
                    <Button
                      onClick={handleSubmitOrder}
                      disabled={createOrderMutation.isPending}
                      className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                      {createOrderMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap
                            size={16}
                            fill="white"
                            className="text-yellow-300"
                          />
                          {order ? "CẬP NHẬT ĐƠN" : "XÁC NHẬN ĐẶT CƠM"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ORDER TRACKING (Compact) */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={18} className="text-emerald-500" />
                  <h3 className="font-black text-gray-900 uppercase text-xs">
                    Đã đặt hôm nay
                  </h3>
                </div>
              </div>

              <div className="p-5">
                {!order ? (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                      Chưa có đơn hàng
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border",
                        order.isConfirmed
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                          : "bg-orange-50 border-orange-100 text-orange-700",
                      )}
                    >
                      {order.isConfirmed ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Timer size={14} />
                      )}
                      <p className="text-[10px] font-black uppercase tracking-wider">
                        {order.isConfirmed ? "Đã xác nhận" : "Đang chờ duyệt"}
                      </p>
                    </div>

                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                      {order.orderItems?.map((item: any) => (
                        <div key={item._id} className="flex gap-3">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-xs font-bold text-gray-800 truncate">
                                {(item.menuItemId as MenuItem)?.name}
                              </p>
                              <span className="text-xs font-black text-gray-900 shrink-0">
                                ×{item.quantity || 1}
                              </span>
                            </div>
                            {item.note && (
                              <p className="text-[9px] text-gray-400 italic">
                                "{item.note}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {!order.isConfirmed && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (window.confirm("Hủy đơn cơm này?")) {
                              deleteOrderMutation.mutate(order._id);
                            }
                          }}
                          className="h-9 rounded-lg border-red-50 text-red-500 hover:bg-red-50 font-black text-[10px]"
                        >
                          HỦY ĐƠN
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            toast({
                              title: "✏️ Đã sẵn sàng",
                              description: "Mời đạo hữu sửa món ở bên trái",
                            });
                          }}
                          className="h-9 rounded-lg border-orange-50 text-orange-600 hover:bg-orange-50 font-black text-[10px]"
                        >
                          SỬA MÓN
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Compact Help Card */}
            <div className="p-5 bg-gray-900 rounded-3xl text-white shadow-lg">
              <h4 className="font-black text-xs mb-1 italic">
                Minh Lao Ma dặn
              </h4>
              <p className="text-gray-400 text-[9px] font-bold leading-relaxed">
                "Có thực mới vực được đạo". Ăn đúng giờ để tu vi tinh tiến nhé
                đạo hữu!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL STYLES */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        input:focus { outline: none; border-color: #fdba74; }
      `,
        }}
      />
    </div>
  );
}
