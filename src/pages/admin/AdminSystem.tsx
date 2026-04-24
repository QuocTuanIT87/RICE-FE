import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  ShieldAlert,
  Globe,
  Phone,
  Image as ImageIcon,
  Loader2,
  Clock,
  Calendar,
  Lock,
  KeyRound,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { systemApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/useToast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { format } from "date-fns";

const SYSTEM_PASSWORD = import.meta.env.VITE_SYSTEM_PASSWORD || "SAIPASSWORD";

const AdminSystem: React.FC = () => {
  const queryClient = useQueryClient();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SYSTEM_PASSWORD) {
      setIsUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput("");
    }
  };
  const [formData, setFormData] = useState<any>({
    websiteName: "",
    websiteLogo: "",
    websiteBanner: "",
    contactPhone: "",
    isMaintenance: false,
    maintenanceStart: "",
    maintenanceEnd: "",
    maintenanceMessage: "",
  });

  const { data: configData, isLoading } = useQuery({
    queryKey: ["systemConfig"],
    queryFn: () => systemApi.getConfig(),
  });

  useEffect(() => {
    if (configData?.data.data) {
      const config = configData.data.data;
      setFormData({
        ...config,
        maintenanceStart: config.maintenanceStart
          ? format(new Date(config.maintenanceStart), "yyyy-MM-dd'T'HH:mm")
          : "",
        maintenanceEnd: config.maintenanceEnd
          ? format(new Date(config.maintenanceEnd), "yyyy-MM-dd'T'HH:mm")
          : "",
      });
    }
  }, [configData]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => systemApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systemConfig"] });
      toast({
        title: "Thành công",
        description: "Đã lưu cấu hình hệ thống!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể lưu cấu hình",
        variant: "destructive",
      });
    },
  });

  // Tự động gạt nút bảo trì khi hết giờ
  useEffect(() => {
    if (!formData.isMaintenance || !formData.maintenanceEnd) return;

    const targetDate = new Date(formData.maintenanceEnd).getTime();
    const now = new Date().getTime();
    const delay = targetDate - now;

    if (delay <= 0) {
      // Đã hết giờ ngay khi load trang
      updateMutation.mutate({ ...formData, isMaintenance: false });
      return;
    }

    const timer = setTimeout(() => {
      updateMutation.mutate({ ...formData, isMaintenance: false });
      toast({
        title: "Thông báo",
        description: "Thời gian bảo trì đã kết thúc. Hệ thống đã tự động mở lại!",
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [formData.isMaintenance, formData.maintenanceEnd]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev: any) => ({ ...prev, isMaintenance: checked }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
        <div className="w-full max-w-md">
          <form onSubmit={handlePasswordSubmit} className="space-y-8 text-center">
            <div className="inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-orange-200 mx-auto">
                <Lock className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Khu vực được bảo vệ</h2>
              <p className="text-gray-500 font-medium text-sm">Nhập mật khẩu quản trị để truy cập cấu hình hệ thống</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                  placeholder="Nhập mật khẩu..."
                  className={cn(
                    "h-14 pl-12 rounded-2xl text-lg font-bold bg-gray-50 border-2 transition-all focus:bg-white",
                    passwordError ? "border-red-400 bg-red-50 shake" : "border-gray-100 focus:border-orange-400"
                  )}
                  autoFocus
                />
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm font-bold animate-in fade-in duration-300">⚠️ Sai mật khẩu, vui lòng thử lại!</p>
              )}
              <Button
                type="submit"
                className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-lg gap-2 shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Lock className="w-5 h-5" />
                Mở khóa
              </Button>
            </div>
          </form>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
            .shake { animation: shake 0.4s ease-in-out; }
          `}} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-orange-500" />
            Cấu hình Website
          </h1>
          <p className="text-gray-500 font-medium">
            Quản lý thông tin cơ bản và trạng thái hoạt động của hệ thống
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 px-8 font-bold gap-2 shadow-lg shadow-orange-100"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Lưu Cấu Hình
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Brand Identity */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl shadow-gray-100 rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-500">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">
                    Nhận diện thương hiệu
                  </CardTitle>
                  <CardDescription>
                    Tên website, logo và banner chính
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Tên Website
                </Label>
                <Input
                  name="websiteName"
                  value={formData.websiteName}
                  onChange={handleChange}
                  placeholder="Ví dụ: Thiên Hương Các"
                  className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  URL Logo
                </Label>
                <div className="flex gap-2">
                  <Input
                    name="websiteLogo"
                    value={formData.websiteLogo}
                    onChange={handleChange}
                    placeholder="/logo.png"
                    className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all"
                  />
                  <Button
                    variant="outline"
                    className="h-12 w-12 rounded-xl p-0 border-gray-100"
                  >
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  URL Banner Trang Chủ
                </Label>
                <div className="flex gap-2">
                  <Input
                    name="websiteBanner"
                    value={formData.websiteBanner}
                    onChange={handleChange}
                    placeholder="/banner.png"
                    className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all"
                  />
                  <Button
                    variant="outline"
                    className="h-12 w-12 rounded-xl p-0 border-gray-100"
                  >
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-gray-100 rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-500">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">
                    Liên hệ & Hỗ trợ
                  </CardTitle>
                  <CardDescription>
                    Thông tin liên hệ hiển thị trên website
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Hotline hiển thị
                </Label>
                <Input
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="0123.456.789"
                  className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className="space-y-8">
          <Card className="border-none shadow-2xl shadow-orange-100 rounded-[2rem] overflow-hidden border-2 border-orange-100/50">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100/50 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-orange-500">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">
                      Trạng thái hệ thống
                    </CardTitle>
                    <CardDescription>
                      Kích hoạt chế độ bảo trì toàn trang
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={formData.isMaintenance}
                  onCheckedChange={handleSwitchChange}
                  className="data-[state=checked]:bg-orange-600"
                />
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div
                className={cn(
                  "p-4 rounded-2xl border flex items-start gap-4 transition-all duration-500",
                  formData.isMaintenance
                    ? "bg-orange-50 border-orange-100 text-orange-800"
                    : "bg-gray-50 border-gray-100 text-gray-500",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-xl",
                    formData.isMaintenance ? "bg-orange-200" : "bg-gray-200",
                  )}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black uppercase text-xs tracking-widest mb-1">
                    Chế độ bảo trì
                  </p>
                  <p className="text-sm font-medium">
                    {formData.isMaintenance
                      ? "Hệ thống đang được khóa. Chỉ Admin mới có thể truy cập các tính năng."
                      : "Hệ thống đang hoạt động bình thường cho tất cả người dùng."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Thời gian bắt đầu
                  </Label>
                  <Input
                    type="datetime-local"
                    name="maintenanceStart"
                    value={formData.maintenanceStart}
                    onChange={handleChange}
                    className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Dự kiến kết thúc
                  </Label>
                  <Input
                    type="datetime-local"
                    name="maintenanceEnd"
                    value={formData.maintenanceEnd}
                    onChange={handleChange}
                    className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Thông báo bảo trì
                </Label>
                <textarea
                  name="maintenanceMessage"
                  value={formData.maintenanceMessage}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-4 rounded-xl bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all font-medium text-sm outline-none resize-none"
                  placeholder="Nhập nội dung thông báo cho khách hàng..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSystem;

// Helper function for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
