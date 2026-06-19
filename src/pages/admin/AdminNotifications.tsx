import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, usersApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Bell, Send, Users as UsersIcon, User as UserIcon, Gift, AlertTriangle, ShieldCheck, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"system" | "gift" | "alert">("system");
  const [targetType, setTargetType] = useState<"all" | "specific">("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");

  // Query sent notifications
  const { data: adminNotifsResponse, isLoading: isLoadingNotifs } = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: () => notificationsApi.getAdminNotifications(),
  });

  const sentNotifications = adminNotifsResponse?.data.data || [];

  // Query users for target selection
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["usersList", userSearch],
    queryFn: () => usersApi.getUsers({ search: userSearch, limit: 10 }),
    enabled: targetType === "specific",
  });

  const usersList = usersResponse?.data?.data?.docs || [];

  // Create notification mutation
  const createMutation = useMutation({
    mutationFn: (data: {
      userId?: string | null;
      title: string;
      content: string;
      type: "system" | "gift" | "alert";
    }) => notificationsApi.createNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
      toast({
        title: "Gửi thông báo thành công!",
        description: "Thông báo đã được phân phối tới người nhận.",
      });
      // Reset form
      setTitle("");
      setContent("");
      setType("system");
      setTargetType("all");
      setSelectedUserId("");
      setUserSearch("");
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Có lỗi xảy ra",
        description: err.response?.data?.message || err.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({ variant: "destructive", title: "Thiếu thông tin", description: "Vui lòng nhập tiêu đề thông báo." });
      return;
    }

    if (!content.trim()) {
      toast({ variant: "destructive", title: "Thiếu thông tin", description: "Vui lòng nhập nội dung thông báo." });
      return;
    }

    if (targetType === "specific" && !selectedUserId) {
      toast({ variant: "destructive", title: "Thiếu thông tin", description: "Vui lòng chọn một người nhận." });
      return;
    }

    createMutation.mutate({
      userId: targetType === "specific" ? selectedUserId : null,
      title: title.trim(),
      content: content.trim(),
      type,
    });
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "gift":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] gap-1 px-2 py-0.5 rounded-full">
            <Gift size={12} />
            Quà tặng
          </Badge>
        );
      case "alert":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-[10px] gap-1 px-2 py-0.5 rounded-full">
            <AlertTriangle size={12} />
            Cảnh báo
          </Badge>
        );
      case "system":
      default:
        return (
          <Badge className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-[10px] gap-1 px-2 py-0.5 rounded-full">
            <Bell size={12} />
            Hệ thống
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          📢 Quản lý & Gửi thông báo hệ thống
        </h1>
        <p className="text-gray-500 text-xs md:text-sm mt-1">
          Soạn thảo và gửi thông báo chung tới toàn bộ nhân viên hoặc gửi riêng cho một đồng nghiệp cụ thể.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cột trái: Form gửi thông báo */}
        <Card className="lg:col-span-2 border-gray-200/80 shadow-sm rounded-2xl">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Send size={18} className="text-orange-500" />
              Soạn thông báo mới
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Định dạng thông báo rõ ràng trước khi phát đi
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Lựa chọn đối tượng */}
              <div className="space-y-2">
                <Label className="text-xs font-extrabold text-gray-700">Đối tượng nhận thông báo</Label>
                <div className="flex gap-6 pt-1">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "all"}
                      onChange={() => {
                        setTargetType("all");
                        setSelectedUserId("");
                      }}
                      className="text-orange-500 focus:ring-orange-500 border-gray-300"
                    />
                    <UsersIcon size={14} className="text-gray-400" />
                    Tất cả mọi người
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "specific"}
                      onChange={() => setTargetType("specific")}
                      className="text-orange-500 focus:ring-orange-500 border-gray-300"
                    />
                    <UserIcon size={14} className="text-gray-400" />
                    Một người cụ thể
                  </label>
                </div>
              </div>

              {/* Tìm kiếm người dùng cụ thể */}
              {targetType === "specific" && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <Label className="text-xs font-extrabold text-gray-700">Chọn người dùng nhận</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm theo tên hoặc email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 text-xs h-9 bg-white border-gray-250 focus-visible:ring-orange-500"
                    />
                  </div>

                  {isLoadingUsers ? (
                    <div className="flex items-center gap-2 justify-center py-3 text-xs text-gray-400 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang tìm kiếm...
                    </div>
                  ) : usersList.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto mt-2 pr-1">
                      {usersList.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => {
                            setSelectedUserId(user._id);
                            setUserSearch(`${user.name} (${user.email})`);
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            selectedUserId === user._id
                              ? "bg-orange-500 text-white font-bold"
                              : "bg-white border border-gray-150 text-gray-700 hover:bg-orange-50/50"
                          }`}
                        >
                          <div className="truncate">
                            <p className="font-extrabold">{user.name}</p>
                            <p className={`text-[10px] ${selectedUserId === user._id ? "text-orange-100" : "text-gray-400"}`}>
                              {user.email}
                            </p>
                          </div>
                          {selectedUserId === user._id && <ShieldCheck size={14} />}
                        </div>
                      ))}
                    </div>
                  ) : userSearch ? (
                    <p className="text-center py-2 text-[10px] text-gray-400 font-bold">Không tìm thấy người dùng này</p>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-bold italic">Nhập từ khóa để tìm nhân viên...</p>
                  )}
                </div>
              )}

              {/* Loại thông báo */}
              <div className="space-y-2">
                <Label className="text-xs font-extrabold text-gray-700">Loại thông báo</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full h-10 px-3 text-xs bg-white border border-gray-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="system">📢 Hệ thống (Bảo trì, cập nhật...)</option>
                  <option value="gift">🎁 Quà tặng (VIP, Khuyến mãi...)</option>
                  <option value="alert">⚠️ Cảnh báo (Nạp/Rút lỗi, Bảo mật...)</option>
                </select>
              </div>

              {/* Tiêu đề */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-extrabold text-gray-700">Tiêu đề thông báo</Label>
                <Input
                  id="title"
                  placeholder="Ví dụ: Bảo trì nâng cấp hệ thống máy chủ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs border-gray-250 focus-visible:ring-orange-500"
                />
              </div>

              {/* Nội dung */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-xs font-extrabold text-gray-700">Nội dung chi tiết</Label>
                <textarea
                  id="content"
                  placeholder="Nhập nội dung thông báo gửi tới người nhận..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 min-h-[100px] resize-none"
                />
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl text-xs h-10 shadow-md shadow-orange-200 mt-2"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Gửi Thông Báo Ngay
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Cột phải: Danh sách thông báo đã gửi */}
        <Card className="lg:col-span-3 border-gray-200/80 shadow-sm rounded-2xl flex flex-col max-h-[700px]">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Bell size={18} className="text-orange-500" />
              Lịch sử thông báo đã gửi
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Danh sách thông báo hệ thống đã phân phối
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 overflow-y-auto flex-1 space-y-4">
            {isLoadingNotifs ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-xs text-gray-400 font-semibold">Đang tải lịch sử thông báo...</p>
              </div>
            ) : sentNotifications.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Bell size={36} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs text-gray-400 font-bold">Chưa có thông báo nào được gửi.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {sentNotifications.map((notif: any) => (
                  <div
                    key={notif._id}
                    className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors space-y-2 bg-white/50"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getNotificationBadge(notif.type)}
                          <span className="text-[10px] text-gray-400 font-bold">
                            {format(new Date(notif.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-gray-950 mt-1">{notif.title}</h4>
                      </div>
                      
                      {/* Badge đối tượng */}
                      <div>
                        {notif.userId ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 font-extrabold rounded-md flex items-center gap-0.5">
                              <UserIcon size={10} />
                              Cá nhân
                            </span>
                            <span className="text-[9px] text-gray-400 mt-0.5 truncate max-w-[120px] font-bold">
                              {notif.userId.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 text-sky-700 font-extrabold rounded-md flex items-center gap-0.5">
                            <UsersIcon size={10} />
                            Cả hệ thống
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed border-t border-gray-50 pt-2">
                      {notif.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
