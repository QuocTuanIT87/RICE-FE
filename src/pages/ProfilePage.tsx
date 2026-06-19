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
import { swalAlert } from "@/utils/swal";
import { useShowBalance } from "@/hooks/useShowBalance";
import { cn, formatVND } from "@/lib/utils";
import { authApi, vouchersApi, vipLevelsApi } from "@/services/api";
import { setUser } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  Wallet,
  Phone,
  RefreshCw,
  Save,
  Shield,
  Ticket,
  User as UserIcon,
  UtensilsCrossed,
  Zap,
  Eye,
  EyeOff,
  Crown,
  Camera,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/utils/cropImage";

type ActiveTab = "overview" | "profile" | "vouchers" | "security";

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const [showBalance, setShowBalance] = useShowBalance();

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

  // States cho Cắt ảnh đại diện
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarImageSrc, setAvatarImageSrc] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      swalAlert({
        title: "⚠️ File quá lớn",
        text: "Kích thước ảnh tối đa là 5MB.",
        icon: "warning",
      });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setAvatarImageSrc(reader.result as string);
      setIsCropDialogOpen(true);
      e.target.value = "";
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixelsData: any) => {
    setCroppedAreaPixels(croppedAreaPixelsData);
  };

  const handleUploadCroppedAvatar = async () => {
    if (!avatarImageSrc || !croppedAreaPixels) return;

    setIsUploadingAvatar(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        avatarImageSrc,
        croppedAreaPixels,
      );
      const croppedImageFile = new File([croppedImageBlob], "avatar.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("avatar", croppedImageFile);

      const response = await authApi.updateAvatar(formData);
      if (response.data.success) {
        dispatch(setUser(response.data.data!));
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        setIsCropDialogOpen(false);
        setAvatarImageSrc(null);
        swalAlert({
          title: "✅ Cập nhật ảnh đại diện SIUUUUUUUUU",
          text: response.data.message,
          icon: null,
          imageUrl: "/ronaldo_left.png",
          imageWidth: 280,
          imageAlt: "Ronaldo Siuuu",
        });
      }
    } catch (error: any) {
      swalAlert({
        title: "❌ Cập nhật thất bại",
        text: error.response?.data?.error?.message || "Không thể tải ảnh lên.",
        icon: "error",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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

    const handleCoinsUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    };

    socket.on("voucher_created", handleVoucherUpdate);
    socket.on("voucher_updated", handleVoucherUpdate);
    socket.on("coins_updated", handleCoinsUpdated);

    return () => {
      socket.off("voucher_created", handleVoucherUpdate);
      socket.off("voucher_updated", handleVoucherUpdate);
      socket.off("coins_updated", handleCoinsUpdated);
    };
  }, [socket, queryClient]);

  const { data: profileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => authApi.getMe(),
  });

  const freshUser = profileData?.data.data || user;
  const userInitial = freshUser?.name?.charAt(0)?.toUpperCase() || "U";

  const { data: vouchersData, isLoading: vouchersLoading } = useQuery({
    queryKey: ["myVouchers"],
    queryFn: () => vouchersApi.getMyVouchers(),
    enabled: !!freshUser,
  });

  const { data: vipLevelsData } = useQuery({
    queryKey: ["vipLevels"],
    queryFn: () => vipLevelsApi.getLevels(),
  });

  const vipLevels = vipLevelsData?.data.data || [];
  const sortedVipLevels = [...vipLevels].sort(
    (a, b) => a.threshold - b.threshold,
  );
  const currentSpent = freshUser?.totalSpent || 0;
  const nextLevelObj = sortedVipLevels.find(
    (level) => level.threshold > currentSpent,
  );

  // Find current level info in sorted list
  const currentLevelIndex = sortedVipLevels.findIndex(
    (level) => level.levelCode === freshUser?.vipLevelCode,
  );
  const currentLevelObj =
    currentLevelIndex !== -1 ? sortedVipLevels[currentLevelIndex] : null;

  let progressPercent = 0;
  let remainingSpent = 0;

  if (nextLevelObj) {
    const prevThreshold = currentLevelObj ? currentLevelObj.threshold : 0;
    const range = nextLevelObj.threshold - prevThreshold;
    const progressInRange = currentSpent - prevThreshold;
    progressPercent =
      range > 0
        ? Math.min(100, Math.max(0, (progressInRange / range) * 100))
        : 0;
    remainingSpent = nextLevelObj.threshold - currentSpent;
  } else {
    progressPercent = 100;
    remainingSpent = 0;
  }

  const myVouchers = vouchersData?.data.data || [];

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      swalAlert({ title: "⚠️ Vui lòng nhập tên", icon: "warning" });
      return;
    }
    setIsUpdating(true);
    try {
      const response = await authApi.updateProfile({ name, phone });
      if (response.data.success) {
        dispatch(setUser(response.data.data!));
        setIsEditing(false);
        swalAlert({
          title: "✅ Cập nhật thông tin cá nhân SIUUUUUUUUU",
          text: response.data.message,
          icon: null,
          imageUrl: "/ronaldo_left.png",
          imageWidth: 280,
          imageAlt: "Ronaldo Siuuu",
        });
      }
    } catch (error: any) {
      swalAlert({
        title: "❌ Cập nhật thất bại",
        text: error.response?.data?.message || "Có lỗi xảy ra",
        icon: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      swalAlert({
        title: "⚠️ Vui lòng nhập đầy đủ thông tin",
        icon: "warning",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      swalAlert({
        title: "❌ Mật khẩu xác nhận không khớp",
        icon: "error",
      });
      return;
    }

    setIsChangingPass(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      swalAlert({
        title: "✅ Đổi mật khẩu thành công! SIUUUUUUUUU",
        icon: null,
        imageUrl: "/ronaldo_left.png",
        imageWidth: 280,
        imageAlt: "Ronaldo Siuuu",
      });

      setIsDialogOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      swalAlert({
        title: "❌ Đổi mật khẩu thất bại",
        text: error.response?.data?.message || "Có lỗi xảy ra",
        icon: "error",
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
            <div className="relative w-14 h-14 rounded-xl overflow-hidden group shrink-0 shadow-lg shadow-orange-100">
              {freshUser?.avatar ? (
                <img
                  src={freshUser.avatar}
                  alt={freshUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-orange-500 flex items-center justify-center text-xl font-black text-white">
                  {userInitial}
                </div>
              )}

              {/* Overlay hover to change avatar */}
              <label
                htmlFor="avatar-upload-input"
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Camera className="w-5 h-5 text-white" />
              </label>

              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-gray-900 truncate uppercase tracking-tight">
                {freshUser?.name}
              </h2>
              <p className="text-[11px] text-gray-400 truncate">
                {freshUser?.email}
              </p>
              <Badge
                className={cn(
                  "mt-1 font-black text-[9px] h-4.5 border-none",
                  freshUser?.vipLevelCode === "diamond"
                    ? "bg-cyan-50 text-cyan-600 border border-cyan-150"
                    : freshUser?.vipLevelCode === "gold"
                      ? "bg-amber-50 text-amber-600 border border-amber-150"
                      : freshUser?.vipLevelCode === "silver"
                        ? "bg-slate-100 text-slate-600 border border-slate-200"
                        : "bg-orange-50 text-orange-600 border border-orange-150",
                )}
              >
                👑 {freshUser?.vipLevelName || "Thành viên"} (
                {freshUser?.vipDiscountRate || 0}%)
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
                      Chào{" "}
                      {freshUser?.name ? freshUser.name.split(" ").pop() : ""}!
                      👋
                    </h1>
                    <p className="text-orange-100 font-medium mt-1">
                      Hôm nay bạn muốn thưởng thức món gì?
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">
                      {freshUser?.role === "admin"
                        ? "👑 Admin Access"
                        : "👤 Thành viên"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/wallet"
                  className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Wallet size={24} className="text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                        Ví tiền của tôi
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 font-bold">
                        {showBalance
                          ? freshUser?.balance !== undefined
                            ? formatVND(freshUser.balance)
                            : "0 đ"
                          : "••••••"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowBalance(!showBalance);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50 focus:outline-none"
                        title={showBalance ? "Ẩn số dư" : "Hiện số dư"}
                      >
                        {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <ArrowRight
                        size={18}
                        className="text-gray-300 group-hover:text-orange-500 transition-colors"
                      />
                    </div>
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

                <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border border-amber-500/20 text-white shadow-xl hover:shadow-2xl transition-all relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
                    <Crown size={200} />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-center">
                          <Crown size={24} className="text-amber-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                            Cấp độ hội viên
                          </p>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black italic tracking-wide text-white uppercase">
                              {freshUser?.vipLevelName || "Thành viên"}
                            </h3>
                            {(freshUser?.vipDiscountRate || 0) > 0 && (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black border-none text-[10px]">
                                Giảm {freshUser?.vipDiscountRate || 0}% đơn hàng
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400">
                            Tích lũy nạp năm nay:{" "}
                            <span className="text-white font-black">
                              {formatVND(currentSpent)}
                            </span>
                          </span>
                          {nextLevelObj && (
                            <span className="text-amber-400">
                              Hạng tiếp theo: {nextLevelObj.name} (
                              {formatVND(nextLevelObj.threshold)})
                            </span>
                          )}
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        {nextLevelObj && remainingSpent > 0 ? (
                          <p className="text-[11px] text-slate-400">
                            Nạp thêm{" "}
                            <span className="text-amber-400 font-bold">
                              {formatVND(remainingSpent)}
                            </span>{" "}
                            để lên hạng{" "}
                            <span className="text-white font-bold">
                              {nextLevelObj.name}
                            </span>{" "}
                            nhận ngay ưu đãi{" "}
                            <span className="text-amber-400 font-bold">
                              -{nextLevelObj.discountRate}%
                            </span>{" "}
                            mỗi đơn đặt cơm!
                          </p>
                        ) : (
                          <p className="text-[11px] text-amber-400 font-bold">
                            🎉 Bạn đã đạt cấp độ VIP cao nhất! Tận hưởng đặc
                            quyền giảm giá tối đa.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Link to="/wallet">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl h-10 px-5 text-xs shadow-lg shadow-amber-500/10 border-none">
                          XEM ĐẶC QUYỀN VIP
                          <ArrowRight size={14} className="ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
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
                      <Link to="/order">
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

      {/* Dialog Cắt ảnh đại diện */}
      <Dialog
        open={isCropDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isUploadingAvatar) {
            setIsCropDialogOpen(false);
            setAvatarImageSrc(null);
          }
        }}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
          <DialogHeader className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-white">
              Cắt ảnh đại diện
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <p className="text-xs text-gray-500 mb-4 font-semibold">
              Kéo thả hoặc sử dụng thanh trượt để phóng to/thu nhỏ vùng cắt (Tỷ
              lệ vuông 1:1).
            </p>

            {/* Vùng Cropper */}
            <div className="relative w-full h-[300px] rounded-xl overflow-hidden bg-gray-200 border border-gray-150">
              {avatarImageSrc && (
                <Cropper
                  image={avatarImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>

            {/* Thanh thu phóng zoom */}
            <div className="mt-5 space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">
                Thu phóng
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>

          <DialogFooter className="p-6 bg-gray-50 flex gap-3 justify-end border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCropDialogOpen(false);
                setAvatarImageSrc(null);
              }}
              disabled={isUploadingAvatar}
              className="rounded-xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              Hủy
            </Button>
            <Button
              onClick={handleUploadCroppedAvatar}
              disabled={isUploadingAvatar}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold h-11 px-6 shadow-md shadow-orange-100"
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang tải lên...
                </>
              ) : (
                "Cắt & Tải lên"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
