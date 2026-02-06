import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User as UserIcon,
  Mail,
  Shield,
  Package,
  Phone,
  Lock,
  Edit2,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  // State cho việc cập nhật thông tin
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // State cho đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast({
        title: "⚠️ Vui lòng nhập tên",
        variant: "destructive",
      });
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
      toast({
        title: "✅ Đổi mật khẩu thành công",
        variant: "success",
      });
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Profile */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <UserIcon size={250} />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/30 shadow-inner">
            <UserIcon size={48} className="text-white" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{user?.name}</h1>
            <p className="text-orange-100 flex items-center justify-center md:justify-start gap-1">
              <Mail size={14} /> {user?.email}
            </p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                  user?.role === "admin"
                    ? "bg-red-500/30 border-red-400 text-white"
                    : "bg-white/20 border-white/30 text-white"
                }`}
              >
                {user?.role === "admin"
                  ? "👑 Quản trị viên"
                  : "👤 Khách hàng thân thiết"}
              </span>
              {user?.isVerified && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/30 border border-green-400 text-white">
                  ✓ Đã xác thực
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto bg-orange-100 p-1 rounded-xl">
          <TabsTrigger
            value="overview"
            className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
          >
            <Edit2 size={16} className="mr-2" /> Hồ sơ cá nhân
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
          >
            <Shield size={16} className="mr-2" /> Bảo mật & Tài khoản
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card className="md:col-span-1 border-none shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="text-orange-500" size={20} />
                  Dịch vụ của tôi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-2xl flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                      Gói đang dùng
                    </span>
                    <span className="font-bold text-gray-700">
                      {user?.activePackage?.mealPackageId
                        ? typeof user.activePackage.mealPackageId === "string"
                          ? "Gói cơ bản"
                          : user.activePackage.mealPackageId.name
                        : "Chưa đăng ký"}
                    </span>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm font-bold">
                    {user?.activePackage ? "✓" : "0"}
                  </div>
                </div>

                <Link to="/my-packages" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-between group"
                  >
                    Xem lịch sử mua gói
                    <ArrowIcon direction="right" />
                  </Button>
                </Link>

                <Link to="/order" className="block">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-200">
                    Đặt cơm ngay hôm nay
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Profile Detail */}
            <Card className="md:col-span-2 border-none shadow-sm h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  {isEditing ? (
                    "Hủy bỏ"
                  ) : (
                    <>
                      <Edit2 size={16} className="mr-2" /> Chỉnh sửa
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-500">Họ và tên</Label>
                    {isEditing ? (
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border-orange-200 focus:ring-orange-500"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-xl font-medium text-gray-700 flex items-center gap-2">
                        <UserIcon size={16} className="text-gray-400" />
                        {user?.name}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-500">Số điện thoại</Label>
                    {isEditing ? (
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Thêm số điện thoại"
                        className="border-orange-200 focus:ring-orange-500"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-xl font-medium text-gray-700 flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        {user?.phone || "Chưa cập nhật"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-500">Địa chỉ Email</Label>
                    <div className="p-3 bg-gray-50 rounded-xl font-medium text-gray-400 flex items-center gap-2 cursor-not-allowed">
                      <Mail size={16} />
                      {user?.email}
                      <span className="ml-auto text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-500">
                        KHÔNG THỂ SỬA
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-500">Ngày tham gia</Label>
                    <div className="p-3 bg-gray-50 rounded-xl font-medium text-gray-700 flex items-center gap-2 capitalize">
                      <AlertCircle size={16} className="text-gray-400" />
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                            month: "long",
                            year: "numeric",
                            day: "numeric",
                          })
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <Button
                    className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 gap-2"
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                  >
                    <Save size={16} />
                    {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-none shadow-sm max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="text-orange-500" size={20} />
                Bảo mật tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <div className="space-y-1">
                  <p className="font-bold text-gray-700">Mật khẩu</p>
                  <p className="text-xs text-gray-500">
                    Thay đổi mật khẩu định kỳ để bảo vệ tài khoản
                  </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      Thay đổi mật khẩu
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Lock className="text-orange-500" size={20} />
                        Đổi mật khẩu mới
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Mật khẩu hiện tại</Label>
                        <Input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="••••••••"
                          className="border-orange-200 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mật khẩu mới</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mật khẩu phải từ 6 ký tự"
                          className="border-orange-200 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Xác nhận mật khẩu mới</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="border-orange-200 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="ghost"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Hủy
                      </Button>
                      <Button
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={handleChangePassword}
                        disabled={isChangingPass}
                      >
                        {isChangingPass
                          ? "Đang thực hiện..."
                          : "Cập nhật mật khẩu"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100">
                <div className="space-y-1">
                  <p className="font-bold text-green-700 flex items-center gap-1">
                    <CheckCircle size={16} />
                    Tài khoản đã xác thực
                  </p>
                  <p className="text-xs text-green-600">
                    Email của bạn đã được xác minh chính chủ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${direction === "left" ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
