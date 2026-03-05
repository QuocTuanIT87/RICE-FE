import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  User as UserIcon,
  Mail,
  Shield,
  Package,
  Phone,
  Lock,
  Edit2,
  Save,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  UtensilsCrossed,
  Loader2,
  KeyRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { authApi } from "@/services/api";
import { setUser } from "@/store/authSlice";
import { toast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";

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
        title: "⚠️ Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "⚠️ Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "⚠️ Mật khẩu mới phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }
    setIsChangingPass(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      toast({ title: "✅ Đổi mật khẩu thành công", variant: "success" });
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* ========== PROFILE HEADER ========== */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 via-orange-500 to-red-500 p-[2px] shadow-xl shadow-orange-200">
        <div className="rounded-2xl bg-gradient-to-br from-orange-500 via-orange-500 to-red-500 p-8 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -right-5 top-20 w-24 h-24 bg-white/5 rounded-full" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30 shadow-lg">
              <span className="text-3xl font-black text-white">
                {userInitial}
              </span>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-black text-white">{user?.name}</h1>
              <p className="text-orange-100 flex items-center justify-center sm:justify-start gap-1.5 text-sm mt-1">
                <Mail size={14} />
                {user?.email}
              </p>
              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                    user?.role === "admin"
                      ? "bg-red-500/30 border-red-300 text-white"
                      : "bg-white/15 border-white/25 text-white"
                  }`}
                >
                  {user?.role === "admin"
                    ? "👑 Quản trị viên"
                    : "👤 Khách hàng"}
                </span>
                {user?.isVerified && (
                  <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 border border-emerald-300 text-white">
                    ✓ Đã xác thực
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== QUICK ACTIONS ========== */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/my-packages"
          className="group flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <Package size={20} className="text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Gói của tôi</p>
            <p className="text-[11px] text-gray-400">
              {user?.activePackage?.mealPackageId
                ? typeof user.activePackage.mealPackageId === "string"
                  ? "Gói cơ bản"
                  : user.activePackage.mealPackageId.name
                : "Chưa đăng ký"}
            </p>
          </div>
          <ArrowRight
            size={16}
            className="text-gray-300 group-hover:text-orange-400 transition-colors"
          />
        </Link>

        <Link
          to="/order"
          className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200 hover:shadow-lg transition-all"
        >
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <UtensilsCrossed size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Đặt cơm ngay</p>
            <p className="text-[11px] text-orange-100">Menu hôm nay</p>
          </div>
          <ArrowRight size={16} className="text-white/60" />
        </Link>
      </div>

      {/* ========== PERSONAL INFO ========== */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Edit2 size={15} className="text-orange-500" />
            </div>
            <h2 className="font-bold text-gray-900">Thông tin cá nhân</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg"
          >
            {isEditing ? "✕ Hủy" : "✏️ Chỉnh sửa"}
          </Button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Họ và tên
              </Label>
              {isEditing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-gray-200 focus:ring-orange-500 focus:border-orange-400"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <UserIcon size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-700 text-sm">
                    {user?.name}
                  </span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Số điện thoại
              </Label>
              {isEditing ? (
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Thêm số điện thoại"
                  className="rounded-xl border-gray-200 focus:ring-orange-500 focus:border-orange-400"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone size={16} className="text-gray-400" />
                  <span
                    className={`font-medium text-sm ${
                      user?.phone ? "text-gray-700" : "text-gray-400 italic"
                    }`}
                  >
                    {user?.phone || "Chưa cập nhật"}
                  </span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Địa chỉ email
              </Label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail size={16} className="text-gray-400" />
                <span className="font-medium text-gray-500 text-sm flex-1 truncate">
                  {user?.email}
                </span>
                <span className="text-[9px] bg-gray-200 px-2 py-0.5 rounded-md text-gray-500 font-bold uppercase shrink-0">
                  Cố định
                </span>
              </div>
            </div>

            {/* Joined */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Ngày tham gia
              </Label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <CalendarDays size={16} className="text-gray-400" />
                <span className="font-medium text-gray-700 text-sm capitalize">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold gap-2 shadow-md shadow-orange-200"
              onClick={handleUpdateProfile}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Lưu thay đổi
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* ========== SECURITY ========== */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Shield size={15} className="text-blue-600" />
          </div>
          <h2 className="font-bold text-gray-900">Bảo mật tài khoản</h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Change Password */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <KeyRound size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Mật khẩu</p>
                <p className="text-[11px] text-gray-400">
                  Đổi mật khẩu định kỳ để bảo vệ tài khoản
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  Thay đổi
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Lock size={16} className="text-orange-500" />
                    </div>
                    Đổi mật khẩu mới
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 font-bold">
                      Mật khẩu hiện tại
                    </Label>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 font-bold">
                      Mật khẩu mới
                    </Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 font-bold">
                      Xác nhận mật khẩu mới
                    </Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                    className="rounded-xl"
                  >
                    Hủy
                  </Button>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold gap-2"
                    onClick={handleChangePassword}
                    disabled={isChangingPass}
                  >
                    {isChangingPass ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      "Cập nhật mật khẩu"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Verified Status */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-700 text-sm">
                Tài khoản đã xác thực
              </p>
              <p className="text-[11px] text-emerald-500">
                Email đã được xác minh chính chủ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
