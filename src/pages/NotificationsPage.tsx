import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Bell, Gift, AlertCircle, CheckCircle2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: response, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications(),
  });

  const notifications = response?.data.data || [];

  // Mark as read mutation
  const readMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read mutation
  const readAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Thành công!",
        description: "Đã đánh dấu đọc tất cả thông báo.",
      });
    },
  });

  const handleMarkAsRead = (id: string, isRead: boolean) => {
    if (!isRead) {
      readMutation.mutate(id);
    }
  };

  const handleMarkAllAsRead = () => {
    if (notifications.some(n => !n.isRead)) {
      readAllMutation.mutate();
    }
  };

  // Filter notifications
  const generalNotifications = notifications.filter((n) => n.userId === null);
  const personalNotifications = notifications.filter((n) => n.userId !== null);

  const unreadGeneralCount = generalNotifications.filter((n) => !n.isRead).length;
  const unreadPersonalCount = personalNotifications.filter((n) => !n.isRead).length;

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case "gift":
        return (
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <Gift size={20} className="animate-pulse" />
          </div>
        );
      case "alert":
        return (
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
            <AlertCircle size={20} />
          </div>
        );
      case "system":
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
            <Bell size={20} />
          </div>
        );
    }
  };

  const renderNotificationList = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <Inbox size={40} className="mx-auto mb-2 text-gray-300" />
          <h4 className="font-bold text-gray-700 text-sm">Hộp thư trống</h4>
          <p className="text-xs text-gray-400 mt-1">Đạo hữu không có thông báo nào ở mục này.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((notif) => (
          <div
            key={notif._id}
            onClick={() => handleMarkAsRead(notif._id, notif.isRead)}
            className={cn(
              "flex gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none bg-white",
              notif.isRead
                ? "border-gray-100 hover:border-gray-250 hover:bg-gray-50/50"
                : "border-orange-100 bg-gradient-to-r from-orange-500/[0.02] via-transparent to-transparent shadow-sm hover:border-orange-200"
            )}
          >
            {renderNotificationIcon(notif.type)}

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <h4 className={cn(
                  "text-xs md:text-sm font-extrabold truncate text-gray-900 leading-tight",
                  !notif.isRead && "text-orange-950 font-black"
                )}>
                  {notif.title}
                </h4>
                <span className="text-[10px] text-gray-400 font-bold shrink-0">
                  {notif.createdAt
                    ? formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })
                    : "Vừa xong"}
                </span>
              </div>
              <p className={cn(
                "text-xs text-gray-500 leading-relaxed whitespace-pre-line",
                !notif.isRead && "text-gray-700 font-medium"
              )}>
                {notif.content}
              </p>
            </div>

            {!notif.isRead && (
              <div className="flex items-center shrink-0">
                <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-sm shadow-orange-300"></span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-orange-500/10 to-amber-500/5 p-6 rounded-2xl border border-orange-100/50 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-950 tracking-tight flex items-center gap-2">
            🔔 Trung tâm thông báo của đạo hữu
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            Nơi nhận các tin tức bảo trì hệ thống và các món quà đặc biệt dành riêng cho bạn.
          </p>
        </div>
        
        {notifications.some((n) => !n.isRead) && (
          <Button
            onClick={handleMarkAllAsRead}
            disabled={readAllMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-200 shrink-0 text-xs h-9"
          >
            <CheckCircle2 size={16} />
            Đọc tất cả
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white border border-gray-100 rounded-2xl space-y-2 shadow-sm">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400 font-semibold">Đang tải thông báo...</p>
        </div>
      ) : (
        <Tabs defaultValue="general" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-1 rounded-2xl h-11 border border-gray-200/50">
            <TabsTrigger value="general" className="rounded-xl font-extrabold text-xs flex items-center justify-center gap-2">
              <span>Thông báo chung</span>
              {unreadGeneralCount > 0 && (
                <Badge className="bg-orange-500 hover:bg-orange-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full scale-90">
                  {unreadGeneralCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="personal" className="rounded-xl font-extrabold text-xs flex items-center justify-center gap-2">
              <span>Thông báo cá nhân</span>
              {unreadPersonalCount > 0 && (
                <Badge className="bg-orange-500 hover:bg-orange-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full scale-90">
                  {unreadPersonalCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="focus-visible:outline-none">
            {renderNotificationList(generalNotifications)}
          </TabsContent>

          <TabsContent value="personal" className="focus-visible:outline-none">
            {renderNotificationList(personalNotifications)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
