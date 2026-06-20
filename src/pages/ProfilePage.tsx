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
import { swalAlert, swalConfirm } from "@/utils/swal";
import { useShowBalance } from "@/hooks/useShowBalance";
import { cn, formatVND } from "@/lib/utils";
import { authApi, vouchersApi, socialApi } from "@/services/api";
import { setUser } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import VipAvatar from "@/components/VipAvatar";
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
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/utils/cropImage";

type ActiveTab = "overview" | "profile" | "vip_cosmetics" | "vouchers" | "security" | "social";

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
  const [vipTheme, setVipTheme] = useState("default");
  const [vipAvatarFrame, setVipAvatarFrame] = useState("none");
  const [vipCoverImage, setVipCoverImage] = useState("");
  const [vipMascot, setVipMascot] = useState("ronaldo");
  const [vipWebsiteName, setVipWebsiteName] = useState("");
  const [vipWebsiteLogo, setVipWebsiteLogo] = useState("");
  const [vipWebsiteBanner, setVipWebsiteBanner] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await authApi.uploadVipLogo(formData);
      if (response.data.success) {
        setVipWebsiteLogo(response.data.data!.vipCosmetics?.vipWebsiteLogo || "");
        dispatch(setUser(response.data.data!));
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        swalAlert({ title: "🎨 Cập nhật Logo VIP thành công!", icon: "success" });
      }
    } catch (error: any) {
      swalAlert({
        title: "❌ Lỗi tải lên logo",
        text: error.response?.data?.message || "Có lỗi xảy ra",
        icon: "error"
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("banner", file);
      const response = await authApi.uploadVipBanner(formData);
      if (response.data.success) {
        setVipWebsiteBanner(response.data.data!.vipCosmetics?.vipWebsiteBanner || "");
        dispatch(setUser(response.data.data!));
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        swalAlert({ title: "🎨 Cập nhật Banner VIP thành công!", icon: "success" });
      }
    } catch (error: any) {
      swalAlert({
        title: "❌ Lỗi tải lên banner",
        text: error.response?.data?.message || "Có lỗi xảy ra",
        icon: "error"
      });
    } finally {
      setIsUploadingBanner(false);
    }
  };

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

  useEffect(() => {
    if (freshUser) {
      setVipTheme(freshUser.vipCosmetics?.vipTheme || "default");
      setVipAvatarFrame(freshUser.vipCosmetics?.vipAvatarFrame || "none");
      setVipCoverImage(freshUser.vipCosmetics?.vipCoverImage || "");
      setVipMascot(freshUser.vipCosmetics?.vipMascot || "ronaldo");
      setVipWebsiteName(freshUser.vipCosmetics?.vipWebsiteName || "");
      setVipWebsiteLogo(freshUser.vipCosmetics?.vipWebsiteLogo || "");
      setVipWebsiteBanner(freshUser.vipCosmetics?.vipWebsiteBanner || "");
    }
  }, [freshUser]);

  const { data: vouchersData, isLoading: vouchersLoading } = useQuery({
    queryKey: ["myVouchers"],
    queryFn: () => vouchersApi.getMyVouchers(),
    enabled: !!freshUser,
  });

  // Removed old VIP levels queries

  const myVouchers = vouchersData?.data.data || [];

  // Social query & mutations
  const { data: friendsResponse, isLoading: friendsLoading } = useQuery({
    queryKey: ["friendsList"],
    queryFn: () => socialApi.getFriendsList(),
    enabled: activeTab === "social",
  });

  const { data: requestsResponse, isLoading: requestsLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: () => socialApi.getFriendRequests(),
    enabled: activeTab === "social",
  });

  const { data: followersResponse, isLoading: followersLoading } = useQuery({
    queryKey: ["followersList"],
    queryFn: () => socialApi.getFollowersList(),
    enabled: activeTab === "social",
  });

  const { data: followingResponse, isLoading: followingLoading } = useQuery({
    queryKey: ["followingList"],
    queryFn: () => socialApi.getFollowingList(),
    enabled: activeTab === "social",
  });

  const friends = friendsResponse?.data.data || [];
  const requests = requestsResponse?.data.data || { incoming: [], outgoing: [] };
  const followers = followersResponse?.data.data || [];
  const following = followingResponse?.data.data || [];

  const unfollowMutation = useMutation({
    mutationFn: (targetId: string) => socialApi.unfollowUser(targetId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["followingList"] });
      queryClient.invalidateQueries({ queryKey: ["followersList"] }); // invalidate both just in case
      toast({
        title: "Hủy theo dõi",
        description: res.data.message || "Đã hủy theo dõi thành công!",
      });
    },
  });

  const acceptFriendMutation = useMutation({
    mutationFn: (targetId: string) => socialApi.acceptFriendRequest(targetId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["friendsList"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      toast({
        title: "Đồng ý kết bạn",
        description: res.data.message || "Đã đồng ý lời mời kết bạn!",
      });
    },
  });

  const declineFriendMutation = useMutation({
    mutationFn: (targetId: string) => socialApi.declineFriendRequest(targetId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      toast({
        title: "Từ chối/Hủy lời mời",
        description: res.data.message || "Đã hủy/từ chối lời mời kết bạn thành công!",
      });
    },
  });

  const unfriendMutation = useMutation({
    mutationFn: (targetId: string) => socialApi.unfriend(targetId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["friendsList"] });
      toast({
        title: "Hủy kết bạn",
        description: res.data.message || "Đã hủy kết bạn thành công!",
      });
    },
  });

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
    ...(freshUser?.hasMembership ? [{ id: "vip_cosmetics", label: "Giao diện VIP 🎨", icon: Crown }] : []),
    {
      id: "vouchers",
      label: "Ví Voucher",
      icon: Ticket,
      badge: myVouchers.length,
    },
    { id: "social", label: "Bạn bè & Theo dõi", icon: Users },
    { id: "security", label: "Bảo mật", icon: Lock },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========== SIDEBAR MENU ========== */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          {/* User Mini Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="relative shrink-0">
              <VipAvatar
                avatarUrl={freshUser?.avatar}
                name={freshUser?.name}
                hasMembership={freshUser?.hasMembership}
                vipAvatarFrame={freshUser?.vipCosmetics?.vipAvatarFrame}
                size="lg"
              />
              {/* Overlay hover to change avatar */}
              <label
                htmlFor="avatar-upload-input"
                className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-2xl z-20"
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
                  "mt-1 font-black text-[9px] h-4.5 border-none bg-amber-50 text-amber-600 border border-amber-150"
                )}
              >
                👑 {freshUser?.hasMembership ? freshUser.membershipName : "Thành viên thường"}
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
              <div className={cn("rounded-3xl p-8 relative overflow-hidden shadow-2xl transition-all duration-300", freshUser?.hasMembership && freshUser?.vipCosmetics?.vipCoverImage ? freshUser.vipCosmetics.vipCoverImage : "bg-gradient-to-br from-orange-500 via-orange-500 to-red-600 shadow-orange-200")}>
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
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-center">
                          <Crown size={24} className="text-amber-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                            Trạng thái hội viên VIP
                          </p>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black italic tracking-wide text-white uppercase">
                              {freshUser?.hasMembership ? freshUser.membershipName : "Thành viên thường"}
                            </h3>
                            {freshUser?.hasMembership && (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black border-none text-[10px]">
                                Giảm {formatVND(freshUser.vipDiscountRate || 0)}/phần
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold">
                          {freshUser?.hasMembership ? (
                            <>
                              Đặc quyền VIP đang hoạt động. Hạn sử dụng đến ngày:{" "}
                              <span className="text-white font-black">
                                {freshUser.membershipExpiresAt ? format(new Date(freshUser.membershipExpiresAt), "dd/MM/yyyy") : ""}
                              </span>
                            </>
                          ) : (
                            "Kích hoạt hội viên VIP để nhận ưu đãi giảm giá đặt cơm và trang trí cá nhân."
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Link to="/wallet">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl h-10 px-5 text-xs shadow-lg shadow-amber-500/10 border-none">
                          {freshUser?.hasMembership ? "GIA HẠN HỘI VIÊN" : "MUA GÓI VIP NGAY"}
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

          {activeTab === "vip_cosmetics" && freshUser?.hasMembership && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Crown size={20} className="text-amber-500 animate-bounce" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">
                      Cá nhân hóa giao diện VIP
                    </h2>
                    <p className="text-xs text-gray-400 font-medium">
                      Thay đổi chủ đề ứng dụng, khung viền avatar và ảnh bìa
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* BẢN XEM TRƯỚC THỜI GIAN THỰC */}
                <div className="space-y-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                    Bản xem trước thời gian thực (Live Preview)
                  </Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mock Navbar Preview */}
                    <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-md p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                          {vipWebsiteLogo ? (
                            <img src={vipWebsiteLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white text-sm">🍚</span>
                          )}
                        </div>
                        <span className="text-sm font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                          {vipWebsiteName || "Thiên Hương Các"}
                        </span>
                      </div>
                      <span className="text-[9px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-black uppercase">
                        Mock Navbar (VIP)
                      </span>
                    </div>

                    {/* Mock Profile Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden flex flex-col">
                      {/* Cover Background */}
                      <div className={cn(
                        "h-24 w-full transition-all duration-500 relative flex items-end justify-center",
                        vipCoverImage || "bg-gradient-to-r from-orange-500 via-orange-500 to-red-600"
                      )}>
                        <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[8px] font-black text-white uppercase tracking-wider">
                          Trang cá nhân
                        </div>
                      </div>
                      
                      {/* Avatar & Info */}
                      <div className="px-6 pb-6 pt-12 text-center relative flex-grow flex flex-col items-center">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                          <VipAvatar
                            avatarUrl={freshUser?.avatar}
                            name={freshUser?.name}
                            vipAvatarFrame={vipAvatarFrame}
                            hasMembership={true}
                            size="lg"
                            className="ring-4 ring-white shadow-md bg-white rounded-2xl"
                          />
                        </div>
                        
                        <div className="space-y-1 mt-1 flex-grow">
                          <h4 className={cn(
                            "text-sm font-black flex items-center justify-center gap-1.5",
                            vipTheme === "gold" && "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 bg-clip-text text-transparent drop-shadow-sm font-extrabold",
                            vipTheme === "sakura" && "bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 bg-clip-text text-transparent font-extrabold",
                            vipTheme === "dark" && "bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent font-extrabold",
                            vipTheme === "default" && "text-gray-900"
                          )}>
                            {freshUser?.name}
                            {vipTheme === "gold" && <Crown size={14} className="text-amber-500 shrink-0 fill-amber-400" />}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold">{freshUser?.email}</p>
                          
                          <div className="pt-2 flex justify-center">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                              vipTheme === "gold" && "bg-amber-100 text-amber-800 border border-amber-200",
                              vipTheme === "sakura" && "bg-pink-100 text-pink-800 border border-pink-200",
                              vipTheme === "dark" && "bg-slate-900 text-slate-100 border border-slate-700",
                              vipTheme === "default" && "bg-orange-100 text-orange-800 border border-orange-200"
                            )}>
                              {freshUser?.membershipName || "Hội Viên VIP"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mock Forum Post Card */}
                    <div className={cn(
                      "p-5 rounded-2xl border transition-all duration-500 shadow-lg flex flex-col justify-between min-h-[160px]",
                      vipTheme === "gold" && "bg-amber-50/10 border-amber-200/50 shadow-amber-500/5",
                      vipTheme === "sakura" && "bg-pink-50/10 border-pink-200/50 shadow-pink-500/5",
                      vipTheme === "dark" && "bg-slate-950 border-slate-800 text-white shadow-slate-900/10",
                      vipTheme === "default" && "bg-white border-gray-100"
                    )}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-2 border-dashed border-gray-100/50">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
                            Hiển thị trên Diễn đàn
                          </span>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            vipTheme === "gold" && "bg-amber-500 animate-pulse",
                            vipTheme === "sakura" && "bg-pink-400 animate-pulse",
                            vipTheme === "dark" && "bg-cyan-400 animate-pulse",
                            vipTheme === "default" && "bg-orange-500"
                          )} />
                        </div>
                        
                        <div className="flex gap-2.5">
                          <VipAvatar
                            avatarUrl={freshUser?.avatar}
                            name={freshUser?.name}
                            vipAvatarFrame={vipAvatarFrame}
                            hasMembership={true}
                            size="md"
                            className="shrink-0"
                          />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={cn(
                                "text-xs font-black truncate",
                                vipTheme === "gold" && "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 bg-clip-text text-transparent font-extrabold",
                                vipTheme === "sakura" && "bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 bg-clip-text text-transparent font-extrabold",
                                vipTheme === "dark" && "bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-extrabold",
                                vipTheme === "default" && "text-gray-900"
                              )}>
                                {freshUser?.name}
                              </span>
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wide",
                                vipTheme === "gold" && "bg-amber-500 text-slate-950",
                                vipTheme === "sakura" && "bg-pink-400 text-white",
                                vipTheme === "dark" && "bg-slate-800 text-cyan-400 border border-slate-700",
                                vipTheme === "default" && "bg-orange-500 text-white"
                              )}>
                                VIP
                              </span>
                            </div>
                            <p className={cn("text-[8px] font-bold text-gray-400", vipTheme === "dark" && "text-slate-500")}>
                              Vừa xong • 🏢 Công sở
                            </p>
                          </div>
                        </div>
                        
                        <p className={cn(
                          "text-xs leading-relaxed font-semibold text-gray-600 mt-1",
                          vipTheme === "dark" && "text-slate-300",
                          vipTheme === "gold" && "text-amber-950/80"
                        )}>
                          "Chào mọi người! Mình vừa trang trí giao diện VIP mới nhìn cực kỳ SIUUUUU đúng không nào? 😎👑"
                        </p>
                      </div>

                      {/* Mock reactions */}
                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100/50 mt-3 text-[8px] font-bold text-gray-400">
                        <span className="flex items-center gap-1">
                          👍❤️ 12 lượt thích
                        </span>
                        <span>
                          2 bình luận
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. Theme Selector */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                    Chủ đề ứng dụng (App Themes)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: "default", name: "Mặc định", desc: "Màu cam truyền thống", color: "#f97316", activeBorder: "border-orange-500", activeBg: "bg-orange-50/30" },
                      { id: "gold", name: "Hoàng Kim", desc: "Sắc vàng quý phái", color: "#fbbf24", activeBorder: "border-amber-500", activeBg: "bg-amber-50/20" },
                      { id: "dark", name: "Đêm Huyền Bí", desc: "Giao diện tối huyền bí", color: "#8b5cf6", activeBorder: "border-violet-500", activeBg: "bg-violet-950/20" },
                      { id: "sakura", name: "Hoa Anh Đào", desc: "Sắc hồng pastel ngọt ngào", color: "#ec4899", activeBorder: "border-pink-400", activeBg: "bg-pink-50/20" },
                    ].map((themeOpt) => (
                      <div
                        key={themeOpt.id}
                        onClick={() => setVipTheme(themeOpt.id)}
                        className={cn(
                          "cursor-pointer p-4 rounded-2xl border transition-all flex flex-col gap-3 justify-between hover:shadow-md",
                          vipTheme === themeOpt.id
                            ? cn("border-2 shadow-sm", themeOpt.activeBorder, themeOpt.activeBg)
                            : "border-gray-100 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="w-6 h-6 rounded-full shrink-0"
                            style={{ backgroundColor: themeOpt.color }}
                          />
                          {vipTheme === themeOpt.id && (
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                              style={{ backgroundColor: themeOpt.color }}
                            >
                              ✓
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{themeOpt.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{themeOpt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Avatar Frame Selector */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                    Khung viền ảnh đại diện
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: "none", name: "Mặc định", desc: "Không dùng khung", icon: "👤" },
                      { id: "gold-crown", name: "Vương Miện Vàng", desc: "Vương miện lấp lánh", icon: "👑" },
                      { id: "neon-ring", name: "Vòng Tròn Neon", desc: "Viền sáng chuyển động", icon: "💫" },
                      { id: "diamond", name: "Kim Cương", desc: "Huy hiệu đá quý lấp lánh", icon: "💎" },
                    ].map((frameOpt) => (
                      <div
                        key={frameOpt.id}
                        onClick={() => setVipAvatarFrame(frameOpt.id)}
                        className={cn(
                          "cursor-pointer p-4 rounded-2xl border transition-all flex flex-col gap-3 justify-between hover:shadow-md",
                          vipAvatarFrame === frameOpt.id
                            ? "border-amber-500 bg-amber-50/20 shadow-sm"
                            : "border-gray-100 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl shrink-0">{frameOpt.icon}</span>
                          {vipAvatarFrame === frameOpt.id && (
                            <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{frameOpt.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{frameOpt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Cover Image Selector */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                    Hình nền Cover trang cá nhân
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { id: "", name: "Mặc định", color: "bg-gradient-to-br from-orange-500 via-orange-500 to-red-600" },
                      { id: "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500", name: "Hoàng Kim", color: "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" },
                      { id: "bg-gradient-to-r from-gray-900 via-slate-800 to-gray-950", name: "Obsidian", color: "bg-gradient-to-r from-gray-900 via-slate-800 to-gray-950" },
                      { id: "bg-gradient-to-r from-pink-300 via-rose-300 to-pink-400", name: "Sakura Bloom", color: "bg-gradient-to-r from-pink-300 via-rose-300 to-pink-400" },
                      { id: "bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500", name: "Đại Dương", color: "bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500" },
                    ].map((coverOpt) => (
                      <div
                        key={coverOpt.id}
                        onClick={() => setVipCoverImage(coverOpt.id)}
                        className={cn(
                          "cursor-pointer rounded-2xl border overflow-hidden transition-all hover:shadow-md",
                          vipCoverImage === coverOpt.id
                            ? "border-amber-500 ring-2 ring-amber-500/20"
                            : "border-gray-200"
                        )}
                      >
                        <div className={cn("h-16 w-full", coverOpt.color)} />
                        <div className="p-2.5 bg-white text-center">
                          <p className="text-xs font-bold text-gray-800">{coverOpt.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Mascot Selector */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                    Thần tượng đồng hành (VIP Mascot)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: "ronaldo", name: "Cristiano Ronaldo (CR7)", desc: "Lời khuyên của anh Bảy SIUUUU! 🇵🇹", icon: "👑" },
                      { id: "messi", name: "Lionel Messi (M10)", desc: "Lời khuyên của anh Mười 🐐 🇦🇷", icon: "🐐" },
                      { id: "neymar", name: "Neymar Jr (NJ10)", desc: "Samba dance của tiểu Neymar 🇧🇷 🤙", icon: "🤙" },
                    ].map((mascotOpt) => (
                      <div
                        key={mascotOpt.id}
                        onClick={() => setVipMascot(mascotOpt.id)}
                        className={cn(
                          "cursor-pointer p-4 rounded-2xl border transition-all flex flex-col gap-3 justify-between hover:shadow-md",
                          vipMascot === mascotOpt.id
                            ? "border-amber-500 bg-amber-50/20 shadow-sm"
                            : "border-gray-100 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl shrink-0">{mascotOpt.icon}</span>
                          {vipMascot === mascotOpt.id && (
                            <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{mascotOpt.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{mascotOpt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Personal VIP Branding */}
                <div className="space-y-6 border-t border-gray-100 pt-6">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <span>🏷️</span> Cá nhân hóa thương hiệu VIP (Branding Customization)
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      Tự đặt tên cho website, thay đổi logo và banner trang chủ của riêng bạn
                    </p>
                  </div>

                  {/* 5.1. Website Name Override */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Tên trang web cá nhân (Website Name)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={vipWebsiteName}
                        onChange={(e) => setVipWebsiteName(e.target.value)}
                        placeholder="Ví dụ: Thiên Đường Ăn Trưa, Cơm Chiều Pro..."
                        className="h-11 rounded-xl border-gray-200 focus:ring-amber-500 flex-grow"
                        maxLength={50}
                      />
                    </div>
                  </div>

                  {/* 5.2. Website Logo Override */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Logo Trang Web VIP (Logo)
                    </Label>
                    
                    {/* Presets */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { id: "", name: "Mặc định", icon: "🍚" },
                        { id: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop", name: "Bento Vàng", icon: "🍱" },
                        { id: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=100&h=100&fit=crop", name: "Sushi Đỏ", icon: "🍣" },
                        { id: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=100&h=100&fit=crop", name: "Sakura Tea", icon: "🌸" },
                      ].map((logoOpt) => (
                        <div
                          key={logoOpt.id}
                          onClick={() => setVipWebsiteLogo(logoOpt.id)}
                          className={cn(
                            "cursor-pointer p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 justify-center hover:shadow-md text-center",
                            vipWebsiteLogo === logoOpt.id
                              ? "border-amber-500 bg-amber-50/20 shadow-sm ring-2 ring-amber-500/20"
                              : "border-gray-100 bg-white"
                          )}
                        >
                          {logoOpt.id ? (
                            <img src={logoOpt.id} alt={logoOpt.name} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                          ) : (
                            <span className="text-2xl">{logoOpt.icon}</span>
                          )}
                          <span className="text-[10px] font-bold text-gray-700">{logoOpt.name}</span>
                        </div>
                      ))}

                      {/* Custom Upload Logo */}
                      <label className="cursor-pointer p-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-50 flex flex-col items-center justify-center gap-2 hover:border-amber-500 transition-all text-center min-h-[92px]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={isUploadingLogo}
                        />
                        {isUploadingLogo ? (
                          <Loader2 className="animate-spin text-amber-500 w-5 h-5" />
                        ) : (
                          <Upload className="text-gray-400 w-5 h-5" />
                        )}
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">
                          {isUploadingLogo ? "ĐANG TẢI..." : "TẢI LOGO"}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* 5.3. Website Banner Override */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Ảnh Banner Trang Chủ VIP (Banner)
                    </Label>
                    
                    {/* Presets */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { id: "", name: "Mặc định", color: "bg-gradient-to-r from-orange-500 to-red-500" },
                        { id: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80", name: "Amber Palace", color: "bg-amber-800" },
                        { id: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80", name: "Cyber Street", color: "bg-slate-800" },
                        { id: "https://images.unsplash.com/photo-1522336572468-97b06e8ef143?w=1200&auto=format&fit=crop&q=80", name: "Sakura Garden", color: "bg-pink-700" },
                      ].map((bannerOpt) => (
                        <div
                          key={bannerOpt.id}
                          onClick={() => setVipWebsiteBanner(bannerOpt.id)}
                          className={cn(
                            "cursor-pointer rounded-2xl border overflow-hidden transition-all hover:shadow-md flex flex-col justify-between",
                            vipWebsiteBanner === bannerOpt.id
                              ? "border-amber-500 ring-2 ring-amber-500/20"
                              : "border-gray-200"
                          )}
                        >
                          {bannerOpt.id ? (
                            <img src={bannerOpt.id} alt={bannerOpt.name} className="h-12 w-full object-cover" />
                          ) : (
                            <div className={cn("h-12 w-full", bannerOpt.color)} />
                          )}
                          <div className="p-1.5 bg-white text-center border-t border-gray-50">
                            <p className="text-[10px] font-bold text-gray-700">{bannerOpt.name}</p>
                          </div>
                        </div>
                      ))}

                      {/* Custom Upload Banner */}
                      <label className="cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-50 flex flex-col items-center justify-center gap-1 hover:border-amber-500 transition-all text-center h-[76px]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                          disabled={isUploadingBanner}
                        />
                        {isUploadingBanner ? (
                          <Loader2 className="animate-spin text-amber-500 w-5 h-5" />
                        ) : (
                          <Upload className="text-gray-400 w-5 h-5" />
                        )}
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">
                          {isUploadingBanner ? "ĐANG TẢI..." : "TẢI BANNER"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <Button
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/10 gap-2 border-none"
                  onClick={async () => {
                    setIsUpdating(true);
                    try {
                      const response = await authApi.updateProfile({
                        vipTheme,
                        vipAvatarFrame,
                        vipCoverImage,
                        vipMascot,
                        vipWebsiteName,
                        vipWebsiteLogo,
                        vipWebsiteBanner,
                      });
                      if (response.data.success) {
                        dispatch(setUser(response.data.data!));
                        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
                        swalAlert({
                          title: "🎨 Kích hoạt giao diện VIP thành công!",
                          text: "Các cài đặt về chủ đề và khung viền đã được áp dụng toàn hệ thống.",
                          icon: "success",
                        });
                      }
                    } catch (error: any) {
                      swalAlert({
                        title: "❌ Kích hoạt giao diện thất bại",
                        text: error.response?.data?.message || "Có lỗi xảy ra",
                        icon: "error",
                      });
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  LƯU THIẾT LẬP GIAO DIỆN
                </Button>
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

          {activeTab === "social" && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b border-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    Bạn bè & Theo dõi
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">
                    Kết nối và theo dõi các đồng nghiệp trong Thiên Hương Các
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* 1. Lời mời kết bạn */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Lời mời đã nhận */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                      📥 Lời mời đã nhận ({requests.incoming?.length || 0})
                    </h3>
                    {friendsLoading || requestsLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-bold italic p-4 bg-gray-55/20 rounded-2xl border border-gray-100">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Đang tải dữ liệu...
                      </div>
                    ) : !requests.incoming || requests.incoming.length === 0 ? (
                      <div className="text-center py-6 text-gray-405 text-xs italic bg-gray-55/30 border border-gray-100 rounded-2xl font-bold">
                        Không có lời mời kết bạn nào.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {requests.incoming.map((reqUser: any) => (
                          <div key={reqUser._id} className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-100 rounded-2xl transition-colors">
                            <Link to={`/user/${reqUser._id}`} className="flex items-center gap-2.5 min-w-0 hover:underline">
                              <VipAvatar
                                avatarUrl={reqUser.avatar}
                                name={reqUser.name}
                                hasMembership={reqUser.hasMembership}
                                vipAvatarFrame={reqUser.vipCosmetics?.vipAvatarFrame}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-black text-gray-800 truncate leading-none">{reqUser.name}</p>
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{reqUser.email}</p>
                              </div>
                            </Link>
                            <div className="flex items-center gap-1 shrink-0 pl-2">
                              <Button
                                onClick={() => acceptFriendMutation.mutate(reqUser._id)}
                                disabled={acceptFriendMutation.isPending}
                                className="h-7 px-2.5 rounded-lg text-[10px] font-black bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                              >
                                Đồng ý
                              </Button>
                              <Button
                                onClick={() => declineFriendMutation.mutate(reqUser._id)}
                                disabled={declineFriendMutation.isPending}
                                variant="ghost"
                                className="h-7 px-2.5 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 hover:text-red-650 border border-red-100 bg-white"
                              >
                                Từ chối
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lời mời đã gửi */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                      📤 Lời mời đã gửi ({requests.outgoing?.length || 0})
                    </h3>
                    {friendsLoading || requestsLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-bold italic p-4 bg-gray-55/20 rounded-2xl border border-gray-100">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Đang tải dữ liệu...
                      </div>
                    ) : !requests.outgoing || requests.outgoing.length === 0 ? (
                      <div className="text-center py-6 text-gray-405 text-xs italic bg-gray-55/30 border border-gray-100 rounded-2xl font-bold">
                        Chưa gửi lời mời nào.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {requests.outgoing.map((reqUser: any) => (
                          <div key={reqUser._id} className="flex items-center justify-between p-3.5 bg-gray-55/20 border border-gray-100 rounded-2xl">
                            <Link to={`/user/${reqUser._id}`} className="flex items-center gap-2.5 min-w-0 hover:underline">
                              <VipAvatar
                                avatarUrl={reqUser.avatar}
                                name={reqUser.name}
                                hasMembership={reqUser.hasMembership}
                                vipAvatarFrame={reqUser.vipCosmetics?.vipAvatarFrame}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-black text-gray-800 truncate leading-none">{reqUser.name}</p>
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{reqUser.email}</p>
                              </div>
                            </Link>
                            <Button
                              onClick={() => declineFriendMutation.mutate(reqUser._id)}
                              disabled={declineFriendMutation.isPending}
                              variant="ghost"
                              className="h-7 px-2.5 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-650 border border-gray-200 bg-white"
                            >
                              Thu hồi
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Danh sách bạn bè */}
                <div className="border-t border-gray-105 pt-6 space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                    👥 Danh sách bạn bè ({friends.length})
                  </h3>
                  {friendsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold italic p-4 bg-gray-55/20 rounded-2xl border border-gray-100">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Đang tải bạn bè...
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-10 text-gray-405 text-xs italic bg-gray-50 border border-gray-100 rounded-2xl font-bold">
                      Chưa có bạn bè nào trong danh sách. Hãy kết nối trên Diễn đàn nhé!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {friends.map((friend: any) => (
                        <div key={friend._id} className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-orange-250 transition-colors">
                          <Link to={`/user/${friend._id}`} className="flex items-center gap-2.5 min-w-0 hover:underline">
                            <VipAvatar
                              avatarUrl={friend.avatar}
                              name={friend.name}
                              hasMembership={friend.hasMembership}
                              vipAvatarFrame={friend.vipCosmetics?.vipAvatarFrame}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-gray-800 truncate leading-none">{friend.name}</p>
                              <p className="text-[10px] text-gray-400 truncate mt-0.5">{friend.email}</p>
                            </div>
                          </Link>
                          <Button
                            onClick={() => {
                              swalConfirm({
                                title: "Hủy kết bạn?",
                                text: `Đạo hữu có chắc chắn muốn hủy kết bạn với ${friend.name}?`,
                                icon: "warning",
                                confirmText: "Hủy kết bạn",
                                cancelText: "Hủy bỏ",
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  unfriendMutation.mutate(friend._id);
                                }
                              });
                            }}
                            disabled={unfriendMutation.isPending}
                            variant="ghost"
                            className="h-7 px-2.5 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 hover:text-red-650 border border-red-50 bg-white"
                          >
                            Hủy kết bạn
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Người theo dõi & Đang theo dõi */}
                <div className="border-t border-gray-105 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Followers */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                      🔔 Người theo dõi ({followers.length})
                    </h3>
                    {followersLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-bold italic p-4 bg-gray-55/20 rounded-2xl border border-gray-100">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Đang tải...
                      </div>
                    ) : followers.length === 0 ? (
                      <div className="text-center py-6 text-gray-405 text-xs italic bg-gray-55/30 border border-gray-100 rounded-2xl font-bold">
                        Chưa có người theo dõi nào.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {followers.map((f: any) => (
                          <div key={f._id} className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-orange-250 transition-colors">
                            <Link to={`/user/${f._id}`} className="flex items-center gap-2.5 min-w-0 hover:underline">
                              <VipAvatar
                                avatarUrl={f.avatar}
                                name={f.name}
                                hasMembership={f.hasMembership}
                                vipAvatarFrame={f.vipCosmetics?.vipAvatarFrame}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-black text-gray-800 truncate leading-none">{f.name}</p>
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{f.email}</p>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Following */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                      📡 Đang theo dõi ({following.length})
                    </h3>
                    {followingLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-bold italic p-4 bg-gray-55/20 rounded-2xl border border-gray-100">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Đang tải...
                      </div>
                    ) : following.length === 0 ? (
                      <div className="text-center py-6 text-gray-405 text-xs italic bg-gray-55/30 border border-gray-100 rounded-2xl font-bold">
                        Chưa theo dõi ai.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {following.map((f: any) => (
                          <div key={f._id} className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-orange-250 transition-colors">
                            <Link to={`/user/${f._id}`} className="flex items-center gap-2.5 min-w-0 hover:underline">
                              <VipAvatar
                                avatarUrl={f.avatar}
                                name={f.name}
                                hasMembership={f.hasMembership}
                                vipAvatarFrame={f.vipCosmetics?.vipAvatarFrame}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-black text-gray-800 truncate leading-none">{f.name}</p>
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{f.email}</p>
                              </div>
                            </Link>
                            <Button
                              onClick={() => unfollowMutation.mutate(f._id)}
                              disabled={unfollowMutation.isPending}
                              variant="ghost"
                              className="h-7 px-2.5 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-red-50 hover:text-red-650 border border-gray-200 hover:border-red-100 bg-white"
                            >
                              Hủy theo dõi
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
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
