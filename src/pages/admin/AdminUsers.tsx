import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import {
  Users,
  Mail,
  Ban,
  CheckCircle,
  Phone,
  Calendar,
  Search,
} from "lucide-react";
import type { User } from "@/types";
import { useState } from "react";

export default function AdminUsers() {
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getUsers(),
  });

  const users = data?.data.data || [];

  // Filter users by search
  const filteredUsers = users.filter(
    (user: User) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      if (isBlocked) {
        await usersApi.unblockUser(userId);
        toast({
          title: "✅ Đã mở khóa tài khoản",
          variant: "success",
        });
      } else {
        await usersApi.blockUser(userId);
        toast({
          title: "🔒 Đã khóa tài khoản",
          variant: "success",
        });
      }
      refetch();
    } catch {
      toast({
        title: "❌ Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">👥</div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Count stats
  const customerCount = users.filter((u: User) => u.role === "user").length;
  const blockedCount = users.filter((u: User) => u.isBlocked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-orange-500" />
          Quản lý người dùng
        </h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{users.length}</p>
            <p className="text-sm text-gray-500">Tổng cộng</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{customerCount}</p>
            <p className="text-sm text-gray-500">Khách hàng</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
            <p className="text-sm text-gray-500">Đã khóa</p>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Không tìm thấy người dùng</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user: User) => (
            <Card
              key={user._id}
              className={`overflow-hidden transition-all hover:shadow-md ${
                user.isBlocked ? "opacity-60 bg-gray-50" : ""
              }`}
            >
              <CardContent className="p-0">
                <div className="flex items-center">
                  {/* Avatar */}
                  <div
                    className={`w-16 h-full flex items-center justify-center ${
                      user.role === "admin"
                        ? "bg-gradient-to-br from-red-500 to-orange-500"
                        : "bg-gradient-to-br from-blue-500 to-cyan-500"
                    }`}
                  >
                    <span className="text-2xl font-bold text-white py-4">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      {user.role === "admin" && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          👑 Admin
                        </span>
                      )}
                      {user.isBlocked && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                          🔒 Khóa
                        </span>
                      )}
                      {user.isVerified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          ✓ Xác thực
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {user.role !== "admin" && (
                    <div className="pr-4">
                      <Button
                        variant={user.isBlocked ? "outline" : "destructive"}
                        size="sm"
                        onClick={() =>
                          handleBlockUser(user._id, user.isBlocked || false)
                        }
                        className="min-w-[100px]"
                      >
                        {user.isBlocked ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" /> Mở khóa
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4 mr-1" /> Khóa
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
