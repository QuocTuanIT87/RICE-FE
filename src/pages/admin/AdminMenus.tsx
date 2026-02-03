import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyMenusApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/utils";
import { UtensilsCrossed, Plus, Lock, Unlock, Eye } from "lucide-react";
import type { MenuItem } from "@/types";

export default function AdminMenus() {
  const queryClient = useQueryClient();
  const [rawContent, setRawContent] = useState("");
  const [previewItems, setPreviewItems] = useState<MenuItem[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [beginAt, setBeginAt] = useState("10:00");
  const [endAt, setEndAt] = useState("10:45");

  const { data: menusData, isLoading } = useQuery({
    queryKey: ["adminMenus"],
    queryFn: () => dailyMenusApi.getMenus(10),
  });

  const previewMutation = useMutation({
    mutationFn: (content: string) => dailyMenusApi.previewMenu(content),
    onSuccess: (response) => {
      setPreviewItems(response.data.data || []);
      toast({ title: "✅ Đã phân tích menu!", variant: "success" });
    },
    onError: () => toast({ title: "❌ Lỗi phân tích", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: () => dailyMenusApi.createMenu({ rawContent, beginAt, endAt }),
    onSuccess: () => {
      toast({ title: "✅ Tạo menu thành công!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminMenus"] });
      setShowCreateForm(false);
      setRawContent("");
      setPreviewItems([]);
    },
    onError: (err: any) => {
      toast({
        title: "❌ Lỗi!",
        description: err.response?.data?.error?.message,
        variant: "destructive",
      });
    },
  });

  const lockMutation = useMutation({
    mutationFn: (id: string) => dailyMenusApi.lockMenu(id),
    onSuccess: () => {
      toast({ title: "🔒 Đã khóa menu!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminMenus"] });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => dailyMenusApi.unlockMenu(id),
    onSuccess: () => {
      toast({ title: "🔓 Đã mở khóa menu!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminMenus"] });
    },
  });

  const menus = menusData?.data.data || [];

  // Group preview items by category
  const groupedPreview: Record<string, MenuItem[]> = {};
  previewItems.forEach((item) => {
    const cat = item.category || "other";
    if (!groupedPreview[cat]) groupedPreview[cat] = [];
    groupedPreview[cat].push(item);
  });

  const categoryLabels: Record<string, string> = {
    new: "☆ Món mới",
    daily: "▪︎ Món mỗi ngày",
    special: "★ Món đặc biệt",
    other: "Món khác",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="text-orange-500" />
          Quản lý menu
        </h1>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo menu hôm nay
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tạo menu mới</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Dán nội dung menu (các món cách nhau bởi dấu phẩy)
              </label>
              <textarea
                className="w-full h-40 border rounded-lg p-3 text-sm"
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder={`VD: A/C đặt cơm trước 10h30 nhé!
☆ MÓN MỚI:
 • Cá đối kho, gà hấp cải xanh, bò xào đậu...`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Bắt đầu đặt
                </label>
                <input
                  type="time"
                  value={beginAt}
                  onChange={(e) => setBeginAt(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kết thúc đặt
                </label>
                <input
                  type="time"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => previewMutation.mutate(rawContent)}
                disabled={!rawContent || previewMutation.isPending}
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem trước
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={previewItems.length === 0 || createMutation.isPending}
              >
                Tạo menu ({previewItems.length} món)
              </Button>
            </div>

            {/* Preview */}
            {previewItems.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">
                  Xem trước ({previewItems.length} món):
                </h4>
                {Object.entries(groupedPreview).map(([cat, items]) => (
                  <div key={cat} className="mb-3">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {categoryLabels[cat]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white border rounded text-sm"
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Menus List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách menu gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Đang tải...</p>
          ) : menus.length === 0 ? (
            <p className="text-gray-500">Chưa có menu nào</p>
          ) : (
            <div className="space-y-3">
              {menus.map((menu) => (
                <div
                  key={menu._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {formatDate(menu.menuDate)}
                      {menu.isLocked && (
                        <span className="ml-2 text-red-500 text-sm">
                          (Đã khóa)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {menu.beginAt} - {menu.endAt} •{" "}
                      {menu.menuItems?.length || 0} món
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {menu.isLocked ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unlockMutation.mutate(menu._id)}
                      >
                        <Unlock className="w-4 h-4 mr-1" /> Mở khóa
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => lockMutation.mutate(menu._id)}
                      >
                        <Lock className="w-4 h-4 mr-1" /> Khóa
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
