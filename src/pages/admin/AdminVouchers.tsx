import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/useToast";
import { cn, formatVND } from "@/lib/utils";
import { usersApi, vouchersApi } from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Calendar,
  Check,
  DollarSign,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Ticket,
  Trash2,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useState } from "react";

export default function AdminVouchers() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "fixed" as "fixed" | "percentage",
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    validTo: "",
    usageLimit: 100,
    isPublic: true,
    targetUsers: [] as string[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["adminVouchers", page],
    queryFn: () => vouchersApi.getVouchers({ page, limit: 6 }),
  });

  const vouchersResponse = data?.data.data;

  const { data: usersData } = useQuery({
    queryKey: ["adminUsersList", userSearchTerm],
    queryFn: () => usersApi.getUsers({ search: userSearchTerm, limit: 100 }),
  });

  // Filter out admins (Backend already filters, but we double check for safety)
  const filteredUsers = (usersData?.data.data?.docs || []).filter(
    (u: any) => u.role !== "admin",
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => vouchersApi.createVoucher(data),
    onSuccess: () => {
      toast({ title: "✅ Đã tạo voucher mới", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Lỗi tạo voucher",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => vouchersApi.updateVoucher(editingId!, data),
    onSuccess: () => {
      toast({ title: "✅ Đã cập nhật voucher", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Lỗi cập nhật voucher",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vouchersApi.deleteVoucher(id),
    onSuccess: () => {
      toast({ title: "🗑️ Đã xóa voucher" });
      queryClient.invalidateQueries({ queryKey: ["adminVouchers"] });
    },
  });

  const handleEdit = (v: any) => {
    setFormData({
      code: v.code,
      description: v.description,
      discountType: v.discountType,
      discountValue: v.discountValue,
      minPurchase: v.minPurchase || 0,
      maxDiscount: v.maxDiscount || 0,
      validTo: format(new Date(v.validTo), "yyyy-MM-dd"),
      usageLimit: v.usageLimit,
      isPublic: v.isPublic !== undefined ? v.isPublic : true,
      targetUsers: v.targetUsers || [],
    });
    setEditingId(v._id);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      code: "",
      description: "",
      discountType: "fixed",
      discountValue: 0,
      minPurchase: 0,
      maxDiscount: 0,
      validTo: "",
      usageLimit: 100,
      isPublic: true,
      targetUsers: [],
    });
  };

  const toggleUserSelection = (userId: string) => {
    setFormData((prev) => {
      const current = [...prev.targetUsers];
      if (current.includes(userId)) {
        return { ...prev, targetUsers: current.filter((id) => id !== userId) };
      } else {
        return { ...prev, targetUsers: [...current, userId] };
      }
    });
  };

  const vouchers = vouchersResponse?.docs || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-xl shadow-lg shadow-orange-100 text-white">
              <Ticket size={24} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Quản lý Voucher
            </h1>
          </div>
          <p className="text-gray-500 font-medium text-sm">
            Thiết lập các chương trình khuyến mãi và tặng quà cho khách hàng.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold gap-2 px-6 shadow-lg shadow-orange-100 h-11 transition-all text-sm"
        >
          <Plus size={18} />
          THÊM MÃ MỚI
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {vouchers.map((v: any) => (
          <div
            key={v._id}
            className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-200 transition-all group"
          >
            <div className="p-5 border-b border-gray-50 flex items-start justify-between bg-gray-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
                  <Ticket size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg uppercase tracking-wider">
                    {v.code}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-black h-4.5 px-1.5 border-gray-200 text-gray-500 uppercase tracking-widest"
                    >
                      {v.discountType === "fixed" ? "GIẢM TIỀN" : "GIẢM %"}
                    </Badge>
                    <Badge
                      className={cn(
                        "text-[9px] font-black h-4.5 px-1.5 border-none uppercase tracking-widest text-white shadow-sm",
                        v.isPublic ? "bg-emerald-500" : "bg-orange-600",
                      )}
                    >
                      {v.isPublic ? "CÔNG KHAI" : "CHỈ ĐỊNH"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(v)}
                  className="h-8 w-8 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm("Xóa mã này?"))
                      deleteMutation.mutate(v._id);
                  }}
                  className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-600 font-bold leading-relaxed line-clamp-2 min-h-[40px]">
                {v.description}
              </p>

              <div className="grid grid-cols-2 gap-y-2 gap-x-2">
                <div className="flex items-center gap-2.5 text-xs font-bold text-gray-500">
                  <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Tag size={12} className="text-orange-500" />
                  </div>
                  <span>
                    -
                    {v.discountType === "fixed"
                      ? formatVND(v.discountValue)
                      : `${v.discountValue}%`}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-gray-500">
                  <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                    <DollarSign size={12} className="text-gray-400" />
                  </div>
                  <span>Min {formatVND(v.minPurchase || 0)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-gray-500">
                  <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Calendar size={12} className="text-gray-400" />
                  </div>
                  <span>Hạn: {format(new Date(v.validTo), "dd/MM/yyyy")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-gray-500">
                  <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Users size={12} className="text-gray-400" />
                  </div>
                  <span>
                    {v.usedCount}/{v.usageLimit} lượt
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  <span>Tiến độ sử dụng</span>
                  <span className="text-orange-600">
                    {Math.round((v.usedCount / v.usageLimit) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (v.usedCount / v.usageLimit) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {vouchers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
              <Ticket size={40} className="text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest">
              Chưa có mã giảm giá nào được tạo
            </p>
          </div>
        )}
      </div>

      {vouchersResponse && (
        <Pagination 
          currentPage={vouchersResponse.page}
          totalPages={vouchersResponse.pages}
          onPageChange={setPage}
        />
      )}

      {/* Main Voucher Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <DialogTitle className="text-2xl font-black italic flex items-center gap-3">
              <Ticket size={28} />
              {editingId ? "CẬP NHẬT VOUCHER" : "TẠO VOUCHER MỚI"}
            </DialogTitle>
            <DialogDescription className="text-orange-100 text-xs font-bold uppercase tracking-widest mt-1">
              Thiết lập các thông số khuyến mãi cho khách hàng
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Mã Voucher
              </Label>
              <Input
                placeholder="VD: GIAM30K"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="h-12 rounded-2xl border-gray-200 focus:ring-orange-500 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Mô tả mã
              </Label>
              <Input
                placeholder="VD: Giảm 30k cho người dùng mới"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="h-12 rounded-2xl border-gray-200 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Loại giảm giá
              </Label>
              <select
                className="w-full h-12 px-4 py-2 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as any,
                  })
                }
              >
                <option value="fixed">Số tiền cố định (VNĐ)</option>
                <option value="percentage">Phần trăm (%)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Giá trị giảm
              </Label>
              <Input
                type="number"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountValue: Number(e.target.value),
                  })
                }
                className="h-12 rounded-2xl border-gray-200 focus:ring-orange-500 font-black text-orange-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Mua tối thiểu (VNĐ)
              </Label>
              <Input
                type="number"
                value={formData.minPurchase}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minPurchase: Number(e.target.value),
                  })
                }
                className="h-12 rounded-2xl border-gray-200 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Ngày hết hạn
              </Label>
              <Input
                type="date"
                value={formData.validTo}
                onChange={(e) =>
                  setFormData({ ...formData, validTo: e.target.value })
                }
                className="h-12 rounded-2xl border-gray-200 focus:ring-orange-500 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Tổng lượt sử dụng
              </Label>
              <Input
                type="number"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimit: Number(e.target.value),
                  })
                }
                className="h-12 rounded-2xl border-gray-200 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Đối tượng áp dụng
              </Label>
              <div className="flex h-12 items-center gap-4 bg-gray-50 rounded-2xl px-4 border border-gray-100">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      isPublic: true,
                      targetUsers: [],
                    })
                  }
                  className={cn(
                    "flex-1 h-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    formData.isPublic
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-400 hover:text-gray-600",
                  )}
                >
                  CÔNG KHAI
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPublic: false })}
                  className={cn(
                    "flex-1 h-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    !formData.isPublic
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-400 hover:text-gray-600",
                  )}
                >
                  CHỈ ĐỊNH
                </button>
              </div>
            </div>

            {!formData.isPublic && (
              <div className="col-span-full">
                <Button
                  type="button"
                  onClick={() => setIsUserPickerOpen(true)}
                  variant="outline"
                  className="w-full h-12 rounded-2xl border-dashed border-blue-200 bg-blue-50/30 text-blue-600 font-bold gap-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Users size={18} />
                  CHỌN DANH SÁCH NGƯỜI DÙNG ({formData.targetUsers.length})
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 bg-gray-50 gap-4">
            <Button
              variant="ghost"
              onClick={closeDialog}
              className="rounded-2xl font-bold text-gray-400"
            >
              HỦY BỎ
            </Button>
            <Button
              onClick={() =>
                editingId
                  ? updateMutation.mutate(formData)
                  : createMutation.mutate(formData)
              }
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !formData.code ||
                !formData.validTo
              }
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black h-12 shadow-xl shadow-orange-100"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : editingId ? (
                "LƯU THAY ĐỔI"
              ) : (
                "XÁC NHẬN TẠO MÃ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Selection Modal */}
      <Dialog open={isUserPickerOpen} onOpenChange={setIsUserPickerOpen}>
        <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-orange-600 text-white">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Users size={22} />
              CHỌN NGƯỜI DÙNG
            </DialogTitle>
            <p className="text-white text-[10px] font-bold uppercase tracking-widest mt-1">
              Chỉ những người được chọn mới có thể sử dụng mã này
            </p>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <Input
                placeholder="Tìm tên hoặc email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-xl border-gray-100 bg-gray-50/50"
              />
            </div>

            <ScrollArea className="h-80 pr-4">
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs font-medium">
                    Không tìm thấy người dùng nào
                  </div>
                ) : (
                  filteredUsers.map((u: any) => (
                    <div
                      key={u._id}
                      onClick={() => toggleUserSelection(u._id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border",
                        formData.targetUsers.includes(u._id)
                          ? "bg-blue-50 border-blue-100"
                          : "bg-white border-transparent hover:bg-gray-50",
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                          formData.targetUsers.includes(u._id)
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-200 bg-white",
                        )}
                      >
                        {formData.targetUsers.includes(u._id) && (
                          <Check size={12} strokeWidth={4} />
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <UserIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate uppercase tracking-tight">
                          {u.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate font-medium">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="p-6 bg-gray-50">
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black h-12"
              onClick={() => setIsUserPickerOpen(false)}
            >
              XÁC NHẬN ({formData.targetUsers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
