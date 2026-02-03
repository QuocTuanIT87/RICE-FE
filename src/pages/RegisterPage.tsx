import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { Eye, EyeOff, UserPlus, Mail, Check } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");

  const registerMutation = useMutation({
    mutationFn: () => authApi.register({ name, email, password }),
    onSuccess: () => {
      toast({
        title: "📧 Đã gửi mã OTP!",
        description: `Kiểm tra email ${email} để lấy mã xác thực.`,
        variant: "success",
      });
      setStep("verify");
    },
    onError: (error: any) => {
      toast({
        title: "❌ Đăng ký thất bại",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyOTP({ email, otp }),
    onSuccess: () => {
      toast({
        title: "🎉 Xác thực thành công!",
        description: "Tài khoản đã được kích hoạt. Hãy đăng nhập!",
        variant: "success",
      });
      navigate("/login");
    },
    onError: (error: any) => {
      toast({
        title: "❌ Mã OTP không đúng",
        description:
          error.response?.data?.error?.message || "Vui lòng kiểm tra lại",
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOTP(email),
    onSuccess: () => {
      toast({
        title: "📧 Đã gửi lại mã OTP!",
        description: "Kiểm tra email của bạn.",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "❌ Không thể gửi lại",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-white to-orange-50 p-4">
      <Card className="w-full max-w-md animate-fade-in shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl">🍚</div>
          <CardTitle className="text-2xl gradient-text">
            {step === "register" ? "Đăng ký tài khoản" : "Xác thực email"}
          </CardTitle>
          <CardDescription>
            {step === "register"
              ? "Tạo tài khoản để bắt đầu đặt cơm!"
              : `Nhập mã OTP đã gửi đến ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "register" ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ tên</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Đăng ký
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Mã OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Đang xác thực...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Xác thực
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
              >
                <Mail className="w-4 h-4 mr-2" /> Gửi lại mã OTP
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep("register")}
              >
                Quay lại
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="text-orange-600 hover:underline font-medium"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
