import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyMenusApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/utils";
import {
  UtensilsCrossed,
  Plus,
  Lock,
  Unlock,
  Pencil,
  Calendar,
  Clock,
  LayoutGrid,
  FileText,
  MoreVertical,
} from "lucide-react";
import type { MenuItem, DailyMenu } from "@/types";
import { useSocket } from "@/contexts/SocketContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminMenus() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form states
  const [rawContent, setRawContent] = useState("");
  const [previewItems, setPreviewItems] = useState<MenuItem[]>([]);
  const [beginAt, setBeginAt] = useState("10:00");
  const [endAt, setEndAt] = useState("10:45");

  // Edit states
  const [editingMenu, setEditingMenu] = useState<DailyMenu | null>(null);
  const [editRawContent, setEditRawContent] = useState("");
  const [editBeginAt, setEditBeginAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editPreviewItems, setEditPreviewItems] = useState<MenuItem[]>([]);

  const { data: menusData, isLoading } = useQuery({
    queryKey: ["adminMenus"],
    queryFn: () => dailyMenusApi.getMenus(15),
  });

  // Real-time listener
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () =>
      queryClient.invalidateQueries({ queryKey: ["adminMenus"] });
    socket.on("menu_created", handleUpdate);
    socket.on("menu_updated", handleUpdate);
    socket.on("menu_locked", handleUpdate);
    socket.on("menu_unlocked", handleUpdate);
    return () => {
      socket.off("menu_created");
      socket.off("menu_updated");
      socket.off("menu_locked");
      socket.off("menu_unlocked");
    };
  }, [socket, queryClient]);

  const previewMutation = useMutation({
    mutationFn: (content: string) => dailyMenusApi.previewMenu(content),
    onSuccess: (res) => {
      setPreviewItems(res.data.data || []);
      toast({ title: "Đã phân tích xong thực đơn", variant: "success" });
    },
  });

  const editPreviewMutation = useMutation({
    mutationFn: (content: string) => dailyMenusApi.previewMenu(content),
    onSuccess: (res) => {
      setEditPreviewItems(res.data.data || []);
      toast({ title: "Đã phân tích lại thực đơn", variant: "success" });
    },
  });

  const createMutation = useMutation({
    mutationFn: () => dailyMenusApi.createMenu({ rawContent, beginAt, endAt }),
    onSuccess: () => {
      toast({ title: "Tạo menu thành công!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminMenus"] });
      setIsCreateOpen(false);
      resetCreateForm();
    },
    onError: (err: any) =>
      toast({
        title: "Lỗi",
        description: err.response?.data?.error?.message,
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      dailyMenusApi.updateMenu(editingMenu!._id, {
        rawContent: editRawContent,
        beginAt: editBeginAt,
        endAt: editEndAt,
      }),
    onSuccess: () => {
      toast({ title: "Cập nhật thành công!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminMenus"] });
      setIsEditOpen(false);
      setEditingMenu(null);
    },
  });

  const lockMutation = useMutation({
    mutationFn: (id: string) => dailyMenusApi.lockMenu(id),
    onSuccess: () => toast({ title: "Đã khóa đặt cơm", variant: "success" }),
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => dailyMenusApi.unlockMenu(id),
    onSuccess: () => toast({ title: "Đã mở khóa đặt cơm", variant: "success" }),
  });

  const menus = menusData?.data.data || [];
  const activeMenu = menus.find((m: DailyMenu) => !m.isLocked);

  const resetCreateForm = () => {
    setRawContent("");
    setPreviewItems([]);
    setBeginAt("10:00");
    setEndAt("10:45");
  };

  const handleStartEdit = (menu: DailyMenu) => {
    setEditingMenu(menu);
    setEditRawContent(menu.rawContent || "");
    setEditBeginAt(menu.beginAt || "10:00");
    setEditEndAt(menu.endAt || "10:45");
    setEditPreviewItems([]);
    setIsEditOpen(true);
  };

  const groupByCategory = (items: MenuItem[]) => {
    const grouped: Record<string, MenuItem[]> = {};
    items.forEach((item) => {
      const cat = item.category || "other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  };

  const categoryLabels: Record<string, string> = {
    new: "Món mới hấp dẫn",
    daily: "Thực đơn hàng ngày",
    special: "Món ngon đặc biệt",
    other: "Các món khác",
  };

  if (isLoading && !menus.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Thực đơn
            </h1>
            {activeMenu && (
              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[10px] px-2 h-5 rounded uppercase">
                ĐANG MỞ ĐẶT
              </Badge>
            )}
          </div>
          <p className="text-gray-500 font-medium text-sm">
            Quản lý danh sách món ăn và khung giờ phục vụ mỗi ngày.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-lg gap-2 font-bold px-6"
        >
          <Plus className="w-4 h-4" />
          TẠO MENU HÔM NAY
        </Button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng số Menu",
            val: menus.length,
            icon: FileText,
            color: "gray",
          },
          {
            label: "Menu đang mở",
            val: activeMenu ? 1 : 0,
            icon: UtensilsCrossed,
            color: "orange",
          },
          {
            label: "Món ăn hôm nay",
            val: activeMenu?.menuItems?.length || 0,
            icon: LayoutGrid,
            color: "emerald",
          },
          {
            label: "Menu đã khóa",
            val: menus.filter((m: any) => m.isLocked).length,
            icon: Lock,
            color: "rose",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm"
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

      {/* Menus Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
          <Calendar size={14} /> Lịch sử thực đơn gần đây
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {menus.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 py-32 text-center bg-gray-50/30 border border-dashed rounded-xl border-gray-200">
              <p className="text-gray-400 font-medium">
                Chưa có dữ liệu thực đơn
              </p>
            </div>
          ) : (
            menus.map((menu: DailyMenu) => (
              <Card
                key={menu._id}
                className={`border border-gray-100 shadow-sm rounded-[2rem] bg-white overflow-hidden ${menu.isLocked ? "grayscale opacity-70 border-dashed" : "hover:border-orange-200 group relative"}`}
              >
                {!menu.isLocked && (
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500"></div>
                )}
                <CardContent className="p-6 space-y-5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-bold text-gray-900 uppercase tracking-tight text-lg group-hover:text-orange-600 transition-colors">
                        {formatDate(menu.menuDate)}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold px-1.5 h-4.5 rounded-md ${menu.isLocked ? "bg-gray-100 text-gray-500" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}
                        >
                          {menu.isLocked ? "ĐÃ KHÓA" : "ĐANG HIỆU LỰC"}
                        </Badge>
                        <span className="text-[10px] font-bold text-gray-300">
                          #
                          {menu._id
                            .substring(menu._id.length - 4)
                            .toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-9 w-9 p-0 rounded-xl hover:bg-orange-50 text-gray-300 hover:text-orange-600"
                        >
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-xl border-orange-100 shadow-xl p-1.5"
                      >
                        <DropdownMenuItem
                          onClick={() => handleStartEdit(menu)}
                          className="cursor-pointer font-bold text-xs p-3 rounded-lg flex items-center gap-3"
                        >
                          <Pencil size={16} className="text-orange-500" /> SỬA
                          MENU
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-orange-50" />
                        <DropdownMenuItem
                          className={`cursor-pointer font-bold text-xs p-3 rounded-lg flex items-center gap-3 ${menu.isLocked ? "text-emerald-600 focus:bg-emerald-50" : "text-rose-600 focus:bg-rose-50"}`}
                          onClick={() =>
                            menu.isLocked
                              ? unlockMutation.mutate(menu._id)
                              : lockMutation.mutate(menu._id)
                          }
                        >
                          {menu.isLocked ? (
                            <>
                              <Unlock size={16} /> MỞ KHÓA MENU
                            </>
                          ) : (
                            <>
                              <Lock size={16} /> KHÓA ĐẶT CƠM
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock size={10} /> Thời gian
                      </p>
                      <p className="text-xs font-black text-gray-700">
                        {menu.beginAt} - {menu.endAt}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <LayoutGrid size={10} /> Đồ ăn
                      </p>
                      <p className="text-xs font-black text-gray-700">
                        {menu.menuItems?.length || 0} món chính
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {menu.menuItems?.slice(0, 4).map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 uppercase truncate max-w-[100px]"
                      >
                        {item.name}
                      </span>
                    ))}
                    {(menu.menuItems?.length || 0) > 4 && (
                      <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        +{menu.menuItems!.length - 4}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/50">
            <DialogTitle className="text-xl font-bold text-gray-900 uppercase tracking-tight">
              Tạo thực đơn hôm nay
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hệ thống sẽ tự động phân tách danh sách món ăn từ nội dung dán
              vào.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                Nội dung thực đơn
              </label>
              <textarea
                className="w-full h-44 border border-gray-100 rounded-xl p-4 text-sm focus:ring-1 focus:ring-orange-500 bg-gray-50/30 transition-all font-medium leading-relaxed"
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="Dán nội dung từ Zalo/Viber vào đây..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                  Bắt đầu nhận đơn
                </label>
                <div className="relative group">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500" />
                  <input
                    type="time"
                    value={beginAt}
                    onChange={(e) => setBeginAt(e.target.value)}
                    className="w-full h-11 pl-11 border border-gray-100 rounded-xl text-sm font-bold focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                  Khóa đặt cơm lúc
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500" />
                  <input
                    type="time"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full h-11 pl-11 border border-gray-100 rounded-xl text-sm font-bold focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {previewItems.length > 0 && (
              <div className="p-5 border border-orange-100 bg-orange-50/20 rounded-2xl relative">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <UtensilsCrossed size={12} /> BẢN NHÁP ({previewItems.length}{" "}
                  MÓN)
                </p>
                <ScrollArea className="h-40 pr-4">
                  <div className="space-y-4">
                    {Object.entries(groupByCategory(previewItems)).map(
                      ([cat, items]) => (
                        <div key={cat} className="space-y-2">
                          <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">
                            {categoryLabels[cat] || cat}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {items.map((item, i) => (
                              <span
                                key={i}
                                className="text-xs font-bold text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-orange-100 shadow-sm"
                              >
                                {item.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 border-t border-gray-50 bg-gray-50/20 gap-3">
            <Button
              onClick={() => previewMutation.mutate(rawContent)}
              variant="outline"
              className="rounded-xl h-11 border-gray-200 font-bold text-xs uppercase"
              disabled={!rawContent || previewMutation.isPending}
            >
              PHÂN TÁCH THỬ
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 px-8 font-bold text-xs uppercase shadow-lg shadow-orange-100 transition-all active:scale-95"
              disabled={previewItems.length === 0 || createMutation.isPending}
            >
              XÁC NHẬN TẠO MENU
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/50">
            <DialogTitle className="text-xl font-bold text-orange-600 uppercase tracking-tight">
              Cập nhật thực đơn
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sửa đổi nội dung chi tiết hoặc khung giờ cho ngày{" "}
              {editingMenu && formatDate(editingMenu.menuDate)}.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                Nội dung thực đơn mới
              </label>
              <textarea
                className="w-full h-44 border border-gray-100 rounded-xl p-4 text-sm focus:ring-1 focus:ring-orange-500 bg-gray-50/30 transition-all font-medium leading-relaxed"
                value={editRawContent}
                onChange={(e) => setEditRawContent(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                  Sửa bắt đầu
                </label>
                <input
                  type="time"
                  value={editBeginAt}
                  onChange={(e) => setEditBeginAt(e.target.value)}
                  className="w-full h-11 px-4 border border-gray-100 rounded-xl text-sm font-bold focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                  Sửa kết thúc
                </label>
                <input
                  type="time"
                  value={editEndAt}
                  onChange={(e) => setEditEndAt(e.target.value)}
                  className="w-full h-11 px-4 border border-gray-100 rounded-xl text-sm font-bold focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {editPreviewItems.length > 0 && (
              <div className="p-5 border border-orange-100 bg-orange-50/20 rounded-2xl">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4">
                  NHÁP CẬP NHẬT ({editPreviewItems.length} MÓN)
                </p>
                <ScrollArea className="h-40 pr-4">
                  <div className="space-y-4">
                    {Object.entries(groupByCategory(editPreviewItems)).map(
                      ([cat, items]) => (
                        <div key={cat} className="space-y-2">
                          <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">
                            {categoryLabels[cat] || cat}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {items.map((item, i) => (
                              <span
                                key={i}
                                className="text-xs font-bold text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-orange-100"
                              >
                                {item.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 border-t border-gray-50 bg-gray-50/20 gap-3">
            <Button
              onClick={() => editPreviewMutation.mutate(editRawContent)}
              variant="outline"
              className="rounded-xl h-11 border-gray-200 font-bold text-xs uppercase"
            >
              XEM THAY ĐỔI
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              className="bg-gray-900 hover:bg-black text-white rounded-xl h-11 px-10 font-bold text-xs uppercase shadow-xl transition-all"
              disabled={updateMutation.isPending}
            >
              LƯU THỰC ĐƠN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
