import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "@/hooks/useToast";
import { cn, formatVND } from "@/lib/utils";
import { authApi, vouchersApi } from "@/services/api";
import { setUser } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coins,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  Package,
  Phone,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Ticket,
  User as UserIcon,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type ActiveTab = "overview" | "profile" | "vouchers" | "security";

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleVoucherUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["myVouchers"] });
      toast({
        title: "🎟️ Voucher mới!",
        description: "Bạn vừa nhận được một mã giảm giá mới trong ví.",
        variant: "success",
      });
    };

    socket.on("voucher_created", handleVoucherUpdate);
    socket.on("voucher_updated", handleVoucherUpdate);

    return () => {
      socket.off("voucher_created", handleVoucherUpdate);
      socket.off("voucher_updated", handleVoucherUpdate);
    };
  }, [socket, queryClient]);

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";

  const { data: vouchersData, isLoading: vouchersLoading } = useQuery({
    queryKey: ["myVouchers"],
    queryFn: () => vouchersApi.getMyVouchers(),
    enabled: !!user,
  });

  const myVouchers = vouchersData?.data.data || [];

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast({ title: "⚠️ Vui lòng nhập tên", variant: "destructive" });
      return;
    }
    setIsUpdating(true);
    try {
      const response = await authApi.updateProfile({ name, phone });
      if (response.data.success) {
        dispatch(setUser(response.data.data!));
        setIsEditing(false);
        toast({
          title: "✅ Đã cập nhật thông tin cá nhân",
          variant: "success",
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Cập nhật thất bại",
        description: error.response?.data?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({
        title: "⚠️ Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "❌ Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPass(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      toast({ title: "✅ Đã đổi mật khẩu thành công!", variant: "success" });
      setIsDialogOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "❌ Đổi mật khẩu thất bại",
        description: error.response?.data?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  const menuItems = [
    { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { id: "profile", label: "Cá nhân", icon: UserIcon },
    {
      id: "vouchers",
      label: "Ví Voucher",
      icon: Ticket,
      badge: myVouchers.length,
    },
    { id: "security", label: "Bảo mật", icon: Lock },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========== SIDEBAR MENU ========== */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          {/* User Mini Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-500 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-orange-100">
              {userInitial}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate uppercase tracking-tight">
                {user?.name}
              </h2>
              <p className="text-[11px] text-gray-400 truncate">
                {user?.email}
              </p>
              <Badge className="mt-1 bg-amber-50 text-amber-600 border-amber-100 text-[9px] font-black h-4.5">
                <Coins size={10} className="mr-1" />
                {(user?.gameCoins || 0).toLocaleString()} Xu
              </Badge>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-bold text-sm",
                  activeTab === item.id
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-100"
                    : "text-gray-500 hover:bg-gray-50 hover:text-orange-500",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    className={cn(
                      "text-[10px] font-black h-5 px-1.5 border-none",
                      activeTab === item.id
                        ? "bg-white/20 text-white"
                        : "bg-orange-100 text-orange-600",
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          <div className="p-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl text-white shadow-xl shadow-orange-100">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">
              Hỗ trợ khách hàng
            </p>
            <p className="text-sm font-medium mb-4 leading-relaxed">
              Bạn cần giúp đỡ về đơn hàng hay góp ý về dịch vụ?
            </p>
            <Button
              variant="secondary"
              className="w-full rounded-xl font-black text-xs h-10 text-orange-600 bg-white hover:bg-orange-50 border-none"
            >
              LIÊN HỆ ADMIN
            </Button>
          </div>
        </div>

        {/* ========== CONTENT AREA ========== */}
        <div className="col-span-1 lg:col-span-9 space-y-6 min-h-[600px]">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header Banner */}
              <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-red-600 p-8 relative overflow-hidden shadow-2xl shadow-orange-200">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -left-5 -bottom-5 w-24 h-24 bg-white/5 rounded-full" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-black text-white italic">
                      Chào {user?.name.split(" ").pop()}! 👋
                    </h1>
                    <p className="text-orange-100 font-medium mt-1">
                      Hôm nay bạn muốn thưởng thức món gì?
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">
                      {user?.role === "admin"
                        ? "👑 Admin Access"
                        : "👤 Thành viên"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/my-packages"
                  className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Package size={24} className="text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                        Gói của tôi
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {user?.activePackage?.mealPackageId
                          ? "Đang hoạt động"
                          : "Chưa đăng ký gói"}
                      </p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="text-gray-300 group-hover:text-orange-500 transition-colors"
                    />
                  </div>
                </Link>

                <Link
                  to="/order"
                  className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UtensilsCrossed size={24} className="text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                        Đặt món ngay
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Thực đơn tươi ngon hôm nay
                      </p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="text-gray-300 group-hover:text-emerald-500 transition-colors"
                    />
                  </div>
                </Link>

                <Link
                  to="/giai-tri"
                  className="md:col-span-2 group p-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-700 text-white shadow-lg shadow-indigo-100 hover:shadow-2xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Sparkles size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black uppercase tracking-widest">
                        Khu giải trí
                      </p>
                      <p className="text-xs text-violet-100 mt-0.5">
                        Chơi game cá cược tích xu đổi quà cực đỉnh
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-black">
                        {(user?.gameCoins || 0).toLocaleString()} Xu
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-white/60 group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <UserIcon size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">
                      Thông tin cá nhân
                    </h2>
                    <p className="text-xs text-gray-400 font-medium">
                      Cập nhật hồ sơ để chúng tôi phục vụ tốt hơn
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(!isEditing)}
                  className="rounded-xl font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  {isEditing ? "HỦY" : "CHỈNH SỬA"}
                </Button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Họ và tên
                    </Label>
                    {isEditing ? (
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 rounded-xl border-gray-200 focus:ring-orange-500"
                      />
                    ) : (
                      <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-transparent font-bold text-gray-700">
                        <UserIcon size={18} className="text-gray-300" />{" "}
                        {user?.name}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Số điện thoại
                    </Label>
                    {isEditing ? (
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09x xxx xxxx"
                        className="h-12 rounded-xl border-gray-200 focus:ring-orange-500"
                      />
                    ) : (
                      <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-transparent font-bold text-gray-700">
                        <Phone size={18} className="text-gray-300" />{" "}
                        {user?.phone || "Chưa cập nhật"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Địa chỉ Email
                    </Label>
                    <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl text-gray-400 font-medium italic border border-gray-100">
                      <Mail size={18} /> {user?.email}
                      <Badge className="ml-auto bg-gray-100 text-gray-400 border-none text-[8px] h-4">
                        CỐ ĐỊNH
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Thành viên từ
                    </Label>
                    <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl text-gray-500 font-bold border border-transparent">
                      <CalendarDays size={18} className="text-gray-300" />
                      {user?.createdAt
                        ? format(
                            new Date(user.createdAt),
                            "dd 'tháng' MM, yyyy",
                          )
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <Button
                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black shadow-lg shadow-orange-100 gap-2"
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    LƯU THÔNG TIN MỚI
                  </Button>
                )}
              </div>
            </div>
          )}

          {activeTab === "vouchers" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                      <Ticket size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900">
                        Ví Voucher
                      </h2>
                      <p className="text-xs text-gray-400 font-medium">
                        Bạn có {myVouchers.length} mã giảm giá khả dụng
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-gray-400 hover:text-orange-500"
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: ["myVouchers"],
                      })
                    }
                    disabled={vouchersLoading}
                  >
                    <RefreshCw
                      size={18}
                      className={vouchersLoading ? "animate-spin" : ""}
                    />
                  </Button>
                </div>

                <div className="p-8">
                  {myVouchers.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                        <Ticket size={40} className="text-gray-200" />
                      </div>
                      <p className="text-gray-400 text-sm font-medium italic">
                        Ví của bạn đang trống trải...
                      </p>
                      <Link to="/packages">
                        <Button className="rounded-xl font-black text-xs bg-orange-500 text-white hover:bg-orange-600 px-8 h-10">
                          SĂN MÃ NGAY
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myVouchers.map((v: any) => (
                        <div
                          key={v._id}
                          className="group relative p-5 border border-gray-100 rounded-3xl bg-white hover:border-orange-300 hover:shadow-xl transition-all overflow-hidden"
                        >
                          <Ticket
                            size={80}
                            className="absolute -right-6 -bottom-6 text-gray-50 group-hover:text-orange-50/50 -rotate-12 transition-all"
                          />
                          <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-orange-600 text-white border-none font-black text-[11px] h-6 px-2.5 rounded-lg tracking-widest italic">
                                {v.code}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] h-5 border-emerald-100 text-emerald-600 bg-emerald-50"
                              >
                                SẴN SÀNG
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                                {v.description}
                              </p>
                              <p className="text-xl font-black text-orange-600 mt-1">
                                {v.discountType === "fixed"
                                  ? `-${formatVND(v.discountValue)}`
                                  : `-${v.discountValue}%`}
                              </p>
                            </div>
                            <div className="pt-3 border-t border-dashed border-gray-100 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                                <Clock size={12} /> HẠN:{" "}
                                {format(new Date(v.validTo), "dd/MM/yyyy")}
                              </div>
                              <Zap size={14} className="text-orange-300" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b border-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Lock size={20} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    Bảo mật tài khoản
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">
                    Quản lý mật khẩu và an toàn tài khoản
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                  <Shield size={24} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      Lời khuyên bảo mật
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed mt-1">
                      Sử dụng mật khẩu mạnh bao gồm chữ cái, số và ký tự đặc
                      biệt để bảo vệ ví tiền và tài khoản đặt cơm của bạn.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <KeyRound size={20} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">
                          Đổi mật khẩu
                        </p>
                        <p className="text-xs text-gray-400">
                          Đổi mật khẩu mới định kỳ để an toàn hơn
                        </p>
                      </div>
                    </div>
                    <Button
                      className="rounded-xl font-black text-xs bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-100 px-6"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      THAY ĐỔI
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <DialogTitle className="text-2xl font-black italic">
              Đổi mật khẩu mới
            </DialogTitle>
            <p className="text-orange-100 text-xs font-medium uppercase tracking-widest mt-1">
              Vui lòng điền đầy đủ các thông tin bên dưới
            </p>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Mật khẩu hiện tại
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500" />
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="h-12 pl-12 rounded-xl border-gray-200 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Mật khẩu mới
              </Label>
              <div className="relative group">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 pl-12 rounded-xl border-gray-200 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Xác nhận mật khẩu
              </Label>
              <div className="relative group">
                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pl-12 rounded-xl border-gray-200 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-gray-50 gap-4">
            <Button
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl font-bold text-gray-400"
            >
              HỦY
            </Button>
            <Button
              className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black shadow-xl shadow-orange-100"
              onClick={handleChangePassword}
              disabled={isChangingPass}
            >
              {isChangingPass ? (
                <Loader2 className="animate-spin" />
              ) : (
                "XÁC NHẬN ĐỔI"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
