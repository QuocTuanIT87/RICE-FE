import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vipLevelsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  RefreshCw,
  Percent,
  Coins,
} from "lucide-react";
import { cn, formatVND } from "@/lib/utils";
import { swalAlert, swalConfirm } from "@/utils/swal";

interface VipLevelFormState {
  _id?: string;
  levelCode: string;
  name: string;
  threshold: number;
  discountRate: number;
}

const initialFormState: VipLevelFormState = {
  levelCode: "",
  name: "",
  threshold: 0,
  discountRate: 0,
};

export default function AdminVipLevels() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<VipLevelFormState>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  const { data: vipLevelsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["vipLevels"],
    queryFn: () => vipLevelsApi.getLevels(),
  });

  const vipLevels = vipLevelsData?.data.data || [];
  const sortedVipLevels = [...vipLevels].sort((a, b) => a.threshold - b.threshold);

  const createMutation = useMutation({
    mutationFn: (data: VipLevelFormState) => vipLevelsApi.createLevel(data),
    onSuccess: () => {
      swalAlert({
        title: "✅ Tạo hạng VIP thành công!",
        icon: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["vipLevels"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      swalAlert({
        title: "❌ Tạo hạng VIP thất bại",
        text: err.response?.data?.error?.message || "Có lỗi xảy ra",
        icon: "error",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VipLevelFormState }) =>
      vipLevelsApi.updateLevel(id, data),
    onSuccess: () => {
      swalAlert({
        title: "✅ Cập nhật hạng VIP thành công!",
        icon: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["vipLevels"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      swalAlert({
        title: "❌ Cập nhật hạng VIP thất bại",
        text: err.response?.data?.error?.message || "Có lỗi xảy ra",
        icon: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vipLevelsApi.deleteLevel(id),
    onSuccess: () => {
      swalAlert({
        title: "🗑️ Đã xóa hạng VIP",
        icon: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["vipLevels"] });
    },
    onError: (err: any) => {
      swalAlert({
        title: "❌ Xóa hạng VIP thất bại",
        text: err.response?.data?.error?.message || "Có lỗi xảy ra",
        icon: "error",
      });
    },
  });

  const handleOpenAdd = () => {
    setFormState(initialFormState);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lvl: VipLevelFormState) => {
    setFormState({ ...lvl });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await swalConfirm({
      title: `Xóa hạng VIP "${name}"?`,
      text: "Các hội viên thuộc hạng này sẽ tự động được đánh giá lại cấp độ VIP theo các mốc cấu hình còn lại. Đạo hữu chắc chắn chứ?",
      confirmText: "XÓA NGAY",
      cancelText: "HỦY",
    });
    if (result.isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.levelCode.trim()) {
      swalAlert({ title: "⚠️ Nhập mã cấp độ", icon: "warning" });
      return;
    }
    if (!formState.name.trim()) {
      swalAlert({ title: "⚠️ Nhập tên cấp độ", icon: "warning" });
      return;
    }
    if (formState.threshold < 0) {
      swalAlert({ title: "⚠️ Mốc nạp tích lũy không hợp lệ", icon: "warning" });
      return;
    }
    if (formState.discountRate < 0 || formState.discountRate > 100) {
      swalAlert({ title: "⚠️ Tỷ lệ giảm giá phải từ 0% đến 100%", icon: "warning" });
      return;
    }

    if (isEditing && formState._id) {
      updateMutation.mutate({ id: formState._id, data: formState });
    } else {
      createMutation.mutate(formState);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Crown className="text-amber-500 fill-amber-500/20" /> Cấu hình Cấp độ VIP
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập mốc nạp tích lũy và tỷ lệ chiết khấu giảm giá cho từng hạng hội viên VIP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 w-10 rounded-xl"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </Button>
          <Button
            onClick={handleOpenAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1.5 h-10 shadow-md shadow-orange-100 border-none"
          >
            <Plus size={16} /> THÊM HẠNG VIP
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        </div>
      ) : sortedVipLevels.length === 0 ? (
        <Card className="border border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Crown size={48} className="text-gray-300" />
            <div>
              <p className="font-bold text-gray-700">Chưa có cấp độ VIP nào</p>
              <p className="text-xs text-gray-400 mt-1">Vui lòng nhấp vào nút "Thêm hạng VIP" để cấu hình cấp độ đầu tiên.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedVipLevels.map((lvl) => (
            <Card
              key={lvl._id}
              className={cn(
                "border relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                lvl.levelCode === "diamond" ? "border-cyan-200 bg-gradient-to-br from-white to-cyan-50/10 shadow-cyan-100/50" :
                lvl.levelCode === "gold" ? "border-amber-200 bg-gradient-to-br from-white to-amber-50/10 shadow-amber-100/50" :
                lvl.levelCode === "silver" ? "border-slate-200 bg-gradient-to-br from-white to-slate-50/10" :
                "border-gray-200 bg-gradient-to-br from-white to-gray-50/10"
              )}
            >
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                      lvl.levelCode === "diamond" ? "bg-cyan-100 text-cyan-700" :
                      lvl.levelCode === "gold" ? "bg-amber-100 text-amber-700" :
                      lvl.levelCode === "silver" ? "bg-slate-100 text-slate-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {lvl.levelCode}
                    </span>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide mt-1">
                      {lvl.name}
                    </h3>
                  </div>
                  <Crown className={cn(
                    "w-8 h-8",
                    lvl.levelCode === "diamond" ? "text-cyan-500 fill-cyan-500/10" :
                    lvl.levelCode === "gold" ? "text-amber-500 fill-amber-500/10" :
                    lvl.levelCode === "silver" ? "text-slate-400 fill-slate-400/10" :
                    "text-gray-300 fill-gray-300/10"
                  )} />
                </div>

                <div className="space-y-2.5 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-medium">Mốc tích lũy:</span>
                    <span className="font-black text-gray-800">{formatVND(lvl.threshold)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-medium">Ưu đãi giảm giá:</span>
                    <span className="font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      -{lvl.discountRate}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(lvl)}
                    className="h-8 w-8 p-0 rounded-lg text-gray-500 hover:text-orange-500 hover:bg-orange-50"
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(lvl._id, lvl.name)}
                    className="h-8 w-8 p-0 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none bg-white shadow-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <DialogTitle className="text-lg font-black uppercase tracking-wide text-white">
              {isEditing ? "Cập nhật cấp độ VIP" : "Thêm cấp độ VIP mới"}
            </DialogTitle>
            <p className="text-xs text-orange-100 font-medium">
              Vui lòng nhập đầy đủ cấu hình cấp độ VIP bên dưới.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="levelCode" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Mã cấp độ VIP (ví dụ: normal, silver, gold, diamond)
              </Label>
              <Input
                id="levelCode"
                placeholder="Ví dụ: silver"
                disabled={isEditing}
                value={formState.levelCode}
                onChange={(e) => setFormState({ ...formState, levelCode: e.target.value.toLowerCase() })}
                className="h-11 rounded-xl border-gray-200 focus:ring-orange-500 font-bold text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Tên hạng VIP hiển thị
              </Label>
              <Input
                id="name"
                placeholder="Ví dụ: Hội Viên Bạc"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="h-11 rounded-xl border-gray-200 focus:ring-orange-500 font-bold text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="threshold" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                  Mốc nạp tích lũy (VND)
                </Label>
                <div className="relative">
                  <Input
                    id="threshold"
                    type="number"
                    placeholder="Ví dụ: 500000"
                    value={formState.threshold || ""}
                    onChange={(e) => setFormState({ ...formState, threshold: Number(e.target.value) })}
                    className="h-11 pr-10 rounded-xl border-gray-200 focus:ring-orange-500 font-bold text-sm"
                  />
                  <Coins className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discountRate" className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                  Ưu đãi giảm giá (%)
                </Label>
                <div className="relative">
                  <Input
                    id="discountRate"
                    type="number"
                    placeholder="Ví dụ: 3"
                    value={formState.discountRate || ""}
                    onChange={(e) => setFormState({ ...formState, discountRate: Number(e.target.value) })}
                    className="h-11 pr-10 rounded-xl border-gray-200 focus:ring-orange-500 font-bold text-sm"
                  />
                  <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2 sm:flex-row flex-col-reverse">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl font-bold text-gray-400 border border-gray-200"
              >
                HỦY
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black shadow-xl shadow-orange-100"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="animate-spin h-5 w-5 mx-auto" />
                ) : (
                  "XÁC NHẬN CẤU HÌNH"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
