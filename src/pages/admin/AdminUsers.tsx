import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import {
  Users,
  Mail,
  Calendar,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  ShieldCheck,
  Phone,
  Package,
  Filter,
  RefreshCw,
} from "lucide-react";
import type { User, UserPackage } from "@/types";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "blocked"
  >("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lấy danh sách user
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getUsers(),
  });

  // Lấy chi tiết user khi mở modal
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["userDetail", selectedUserId],
    queryFn: () => usersApi.getUserById(selectedUserId!),
    enabled: !!selectedUserId && isModalOpen,
  });

  const users = data?.data.data || [];
  const userDetail = detailData?.data.data;

  const filteredUsers = useMemo(() => {
    return users.filter((user: User) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !user.isBlocked) ||
        (statusFilter === "blocked" && user.isBlocked);

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const handleBlockUser = async (
    userId: string,
    isCurrentlyBlocked: boolean,
  ) => {
    try {
      if (isCurrentlyBlocked) {
        await usersApi.unblockUser(userId);
        toast({ title: "Đã mở khóa tài khoản", variant: "success" });
      } else {
        await usersApi.blockUser(userId);
        toast({ title: "Đã khóa tài khoản", variant: "success" });
      }
      refetch();
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`Xác nhận reset mật khẩu của "${userName}" về 123456?`))
      return;
    try {
      await usersApi.resetPassword(userId);
      toast({
        title: `Đã reset mật khẩu của ${userName} về 123456`,
        variant: "success",
      });
    } catch {
      toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    }
  };

  const handleViewDetails = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u: User) => !u.isBlocked).length,
      blocked: users.filter((u: User) => u.isBlocked).length,
      admins: users.filter((u: User) => u.role === "admin").length,
    }),
    [users],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-500">
      {/* Page Header - Clean & Sharp */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Người dùng
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Quản lý và theo dõi danh sách thành viên hệ thống.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 w-10 rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </Button>
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <Input
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 border-gray-200 focus:ring-1 focus:ring-orange-500 rounded-lg transition-all"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 border-gray-200 rounded-lg gap-2 text-sm font-medium hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 text-gray-500" />
                Trạng thái:{" "}
                {statusFilter === "all"
                  ? "Tất cả"
                  : statusFilter === "active"
                    ? "Hoạt động"
                    : "Bị khóa"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-lg shadow-lg border-gray-100"
            >
              <DropdownMenuItem
                onClick={() => setStatusFilter("all")}
                className="cursor-pointer"
              >
                Tất cả
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("active")}
                className="cursor-pointer text-emerald-600"
              >
                Đang hoạt động
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("blocked")}
                className="cursor-pointer text-rose-600"
              >
                Bị khóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modern Stats - Minimalist but "Ngon" */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng số", val: stats.total, icon: Users, color: "gray" },
          {
            label: "Hoạt động",
            val: stats.active,
            icon: UserCheck,
            color: "emerald",
          },
          { label: "Bị khóa", val: stats.blocked, icon: UserX, color: "rose" },
          {
            label: "Admin",
            val: stats.admins,
            icon: ShieldCheck,
            color: "orange",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-all hover:bg-gray-50/50"
          >
            <div
              className={`w-9 h-9 flex items-center justify-center rounded-lg bg-${s.color}-50 text-${s.color}-600 mb-3`}
            >
              <s.icon size={18} />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {s.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 leading-none mt-1">
              {s.val}
            </p>
          </div>
        ))}
      </div>

      {/* User List - Clean Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="lg:col-span-2 py-32 text-center bg-gray-50/30 border border-dashed rounded-xl border-gray-200">
            <p className="text-gray-400 font-medium">
              Không tìm thấy người dùng nào phù hợp
            </p>
          </div>
        ) : (
          filteredUsers.map((user: User) => (
            <Card
              key={user._id}
              className={`border-gray-100 shadow-sm hover:border-orange-200 transition-all rounded-xl overflow-hidden cursor-default group ${user.isBlocked ? "bg-gray-50/50 grayscale-[0.5]" : "bg-white"}`}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="w-11 h-11 border border-gray-100 rounded-lg shrink-0">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    />
                    <AvatarFallback className="bg-gray-100 text-gray-500 font-bold">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors uppercase text-sm tracking-tight">
                        {user.name}
                      </h3>
                      {user.role === "admin" && (
                        <Badge className="bg-orange-50 text-orange-600 border-none px-1.5 h-4.5 rounded text-[9px] font-bold uppercase">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate font-medium">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => handleViewDetails(user._id)}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-4 rounded-lg font-bold text-[11px] text-orange-600 hover:bg-orange-50"
                  >
                    CHI TIẾT
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 text-gray-400"
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-lg shadow-xl"
                    >
                      <DropdownMenuItem
                        onClick={() =>
                          handleBlockUser(user._id, user.isBlocked || false)
                        }
                        className={`cursor-pointer font-semibold text-xs py-2 ${user.isBlocked ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {user.isBlocked
                          ? "Gỡ khóa tài khoản"
                          : "Khóa tài khoản"}
                      </DropdownMenuItem>
                      {user.role !== "admin" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleResetPassword(user._id, user.name)
                          }
                          className="cursor-pointer font-semibold text-xs py-2 text-orange-600 gap-2"
                        >
                          Reset mật khẩu
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* User Detail Modal - Clean & Modern */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-xl border-none shadow-2xl bg-white">
          {detailLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Đang tải...
              </p>
            </div>
          ) : !userDetail ? (
            <div className="py-20 text-center">
              <p className="text-gray-400 font-medium">
                Không tìm thấy thông tin
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar className="w-20 h-20 border-2 border-white shadow-md rounded-xl">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userDetail?.user?.name}`}
                    />
                    <AvatarFallback className="bg-gray-200 text-gray-500 text-xl font-bold">
                      {userDetail?.user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center md:text-left space-y-1.5 min-w-0">
                    <DialogTitle className="text-2xl font-bold text-gray-900 uppercase tracking-tight truncate">
                      {userDetail?.user?.name}
                    </DialogTitle>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-500 text-xs font-medium">
                      <p className="flex items-center gap-1.5">
                        <Mail size={14} className="text-gray-400" />{" "}
                        {userDetail?.user.email}
                      </p>
                      {userDetail?.user?.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone size={14} className="text-gray-400" />{" "}
                          {userDetail?.user?.phone}
                        </p>
                      )}
                    </div>
                    <div className="pt-2 flex justify-center md:justify-start gap-2">
                      <Badge
                        className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${userDetail?.user.isBlocked ? "bg-rose-500" : "bg-emerald-500"} text-white border-none shadow-sm`}
                      >
                        {userDetail?.user.isBlocked ? "Đã khóa" : "Hoạt động"}
                      </Badge>
                      {userDetail?.user.role === "admin" && (
                        <Badge className="bg-orange-50 text-orange-600 border-none rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm">
                          Administrator
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <Tabs defaultValue="info" className="space-y-8">
                  <TabsList className="bg-gray-100/50 p-1 h-10 rounded-lg inline-flex">
                    <TabsTrigger
                      value="info"
                      className="rounded-md px-6 text-[10px] font-bold uppercase tracking-widest"
                    >
                      Tổng quan
                    </TabsTrigger>
                    <TabsTrigger
                      value="packages"
                      className="rounded-md px-6 text-[10px] font-bold uppercase tracking-widest"
                    >
                      Gói cơm ({userDetail?.packages?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="orders"
                      className="rounded-md px-6 text-[10px] font-bold uppercase tracking-widest"
                    >
                      Lịch sử ({userDetail?.orders?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="h-[380px] -mr-4 pr-4">
                    <TabsContent
                      value="info"
                      className="mt-0 space-y-4 animate-in fade-in duration-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          {
                            label: "Ngày tham gia",
                            value: formatDate(
                              userDetail?.user?.createdAt || "",
                            ),
                            icon: Calendar,
                          },
                          {
                            label: "Số điện thoại",
                            value: userDetail.user.phone || "N/A",
                            icon: Phone,
                          },
                          {
                            label: "Xác thực email",
                            value: userDetail.user.isVerified
                              ? "Đã xác thực"
                              : "Chưa xác thực",
                            icon: Mail,
                          },
                          {
                            label: "Gói hiện tại",
                            value:
                              userDetail?.user?.activePackageId?.mealPackageId
                                ?.name || "Chưa chọn gói",
                            icon: Package,
                          },
                        ].map((item, id) => (
                          <div
                            key={id}
                            className="p-4 border rounded-xl border-gray-100 bg-white"
                          >
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              <item.icon size={12} /> {item.label}
                            </p>
                            <p className="font-bold text-gray-800 text-sm">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="packages"
                      className="mt-0 space-y-3 animate-in fade-in duration-300"
                    >
                      {!userDetail?.packages ||
                      userDetail?.packages?.length === 0 ? (
                        <p className="text-center py-10 text-gray-400 text-xs font-medium italic">
                          Không có gói cơm nào
                        </p>
                      ) : (
                        userDetail?.packages?.map((pkg: UserPackage) => {
                          const mealPkg = pkg.mealPackageId as any;
                          return (
                            <div
                              key={pkg._id}
                              className="p-5 border border-gray-100 rounded-xl bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-gray-200 transition-colors"
                            >
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm uppercase tracking-tight">
                                  {mealPkg.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-bold uppercase">
                                  <span>
                                    {mealPkg.packageType === "no-rice"
                                      ? "Không cơm"
                                      : "Có cơm"}
                                  </span>
                                  <span>•</span>
                                  <span>Mở: {formatDate(pkg.purchasedAt)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">
                                    Số lượt
                                  </p>
                                  <p className="text-xl font-bold text-orange-600">
                                    {pkg.remainingTurns}
                                    <span className="text-gray-200 text-sm">
                                      /{mealPkg.turns}
                                    </span>
                                  </p>
                                </div>
                                <Badge
                                  className={`rounded-md text-[9px] font-bold uppercase ${pkg.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"} border-none`}
                                >
                                  {pkg.isActive ? "Hiệu lực" : "Hết hạn"}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </TabsContent>

                    <TabsContent
                      value="orders"
                      className="mt-0 space-y-3 animate-in fade-in duration-300"
                    >
                      {!userDetail?.orders ||
                      userDetail?.orders?.length === 0 ? (
                        <p className="text-center py-10 text-gray-400 text-xs font-medium italic">
                          Chưa có lịch sử đặt cơm
                        </p>
                      ) : (
                        userDetail?.orders?.map((order: any) => (
                          <div
                            key={order._id}
                            className="p-4 border border-gray-100 rounded-xl bg-white"
                          >
                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-50">
                              <div>
                                <h5 className="font-bold text-gray-900 text-sm">
                                  {formatDate(order.orderedAt)}
                                </h5>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                  {order.orderType === "no-rice"
                                    ? "Thực đơn Không cơm"
                                    : "Thực đơn Có cơm"}
                                </p>
                              </div>
                              <Badge
                                className={`rounded px-1.5 h-4.5 text-[8px] font-bold uppercase border-none ${order.isConfirmed ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                              >
                                {order.isConfirmed ? "Hoàn tất" : "Chờ duyệt"}
                              </Badge>
                            </div>
                            <div className="space-y-1.5">
                              {order.orderItems?.map((item: any, i: number) => (
                                <div key={i} className="flex flex-col">
                                  <span className="text-xs font-semibold text-gray-700">
                                    {item.menuItemId?.name}
                                  </span>
                                  {item.note && (
                                    <span className="text-[10px] text-orange-600 italic mt-0.5">
                                      Lưu ý: {item.note}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </div>

              <div className="p-6 border-t border-gray-50 bg-gray-50/20 flex justify-end">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="ghost"
                  className="h-10 px-10 rounded-lg font-bold text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
