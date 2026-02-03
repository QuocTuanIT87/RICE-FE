import { useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <User className="text-orange-500" />
        Thông tin cá nhân
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Tài khoản của bạn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="w-10 h-10 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                  user?.role === "admin"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {user?.role === "admin" ? "👑 Quản trị viên" : "👤 Khách hàng"}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Trạng thái</p>
                <p className="font-medium text-green-600">Đã xác thực ✓</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t flex gap-3">
            <Link to="/my-packages">
              <Button variant="outline" className="gap-2">
                <Package className="w-4 h-4" />
                Xem gói của tôi
              </Button>
            </Link>
            <Link to="/order">
              <Button className="gap-2">Đặt cơm ngay</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
