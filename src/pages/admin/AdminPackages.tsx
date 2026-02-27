import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mealPackagesApi, packagePurchasesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatVND, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Clock,
  AlertCircle,
  MoreVertical,
  Layers,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import type { MealPackage, User, PackagePurchaseRequest } from "@/types";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminPackages() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MealPackage | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    turns: 1,
    price: 0,
    validDays: 7,
    qrCodeImage: "",
  });

  const {
    data: packagesData,
    isLoading: packagesLoading,
    refetch: refetchPackages,
    isFetching: isFetchingPackages,
  } = useQuery({
    queryKey: ["adminMealPackages"],
    queryFn: () => mealPackagesApi.getPackages(),
  });

  const {
    data: requestsData,
    refetch: refetchRequests,
    isFetching: isFetchingRequests,
  } = useQuery({
    queryKey: ["adminPurchaseRequests", "pending"],
    queryFn: () => packagePurchasesApi.getAllRequests("pending"),
  });

  // Real-time listener
  useEffect(() => {
    if (!socket) return;
    const handleNewRequest = () => {
      toast({
        title: "Yêu cầu mới!",
        description: "Có thượng đế đang chờ duyệt gói cơm.",
      });
      queryClient.invalidateQueries({ queryKey: ["adminPurchaseRequests"] });
    };
    socket.on("purchase_request_created", handleNewRequest);
    return () => {
      socket.off("purchase_request_created", handleNewRequest);
    };
  }, [socket, queryClient]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<MealPackage>) =>
      mealPackagesApi.createPackage(data),
    onSuccess: () => {
      toast({ title: "Đã tạo gói mới thành công", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminMealPackages"] });
      closeDialog();
    },
    onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MealPackage> }) =>
      mealPackagesApi.updatePackage(id, data),
    onSuccess: () => {
      toast({ title: "Cập nhật gói thành công", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminMealPackages"] });
      closeDialog();
    },
    onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mealPackagesApi.deletePackage(id),
    onSuccess: () => {
      toast({ title: "Đã xóa gói cơm", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminMealPackages"] });
    },
    onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => packagePurchasesApi.approveRequest(id),
    onSuccess: () => {
      toast({ title: "Đã duyệt yêu cầu!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminPurchaseRequests"] });
    },
    onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => packagePurchasesApi.rejectRequest(id),
    onSuccess: () => {
      toast({ title: "Đã từ chối yêu cầu", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminPurchaseRequests"] });
    },
    onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
  });

  const packages = packagesData?.data.data || [];
  const pendingRequests = requestsData?.data.data || [];

  const stats = useMemo(
    () => ({
      total: packages.length,
      active: packages.filter((p: MealPackage) => p.isActive).length,
      pending: pendingRequests.length,
    }),
    [packages, pendingRequests],
  );

  const openCreateDialog = () => {
    setEditingPackage(null);
    setFormData({
      name: "",
      turns: 1,
      price: 0,
      validDays: 7,
      qrCodeImage: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (pkg: MealPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      turns: pkg.turns,
      price: pkg.price,
      validDays: pkg.validDays,
      qrCodeImage: pkg.qrCodeImage || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPackage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (packagesLoading && !packages.length) {
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
              Gói cơm
            </h1>
            {stats.pending > 0 && (
              <Badge className="bg-orange-500 text-white border-none animate-pulse">
                {stats.pending} YÊU CẦU ĐANG CHỜ
              </Badge>
            )}
          </div>
          <p className="text-gray-500 font-medium text-sm">
            Thiết lập và quản lý các gói dịch vụ suất ăn cho hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              refetchPackages();
              refetchRequests();
            }}
            disabled={isFetchingPackages || isFetchingRequests}
            className="h-10 w-10 rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200"
          >
            <RefreshCw
              size={16}
              className={
                isFetchingPackages || isFetchingRequests ? "animate-spin" : ""
              }
            />
          </Button>
          <Button
            onClick={openCreateDialog}
            className="h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-lg gap-2 font-bold transition-all px-6"
          >
            <Plus className="w-4 h-4" />
            TẠO GÓI MỚI
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng số gói",
            val: stats.total,
            icon: Package,
            color: "gray",
          },
          {
            label: "Đang chờ duyệt",
            val: stats.pending,
            icon: Clock,
            color: stats.pending > 0 ? "orange" : "gray",
          },
          {
            label: "Gói hoạt động",
            val: stats.active,
            icon: Check,
            color: "emerald",
          },
          {
            label: "Doanh thu (tháng)",
            val: "0đ",
            icon: TrendingUp,
            color: "blue",
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Package List - Main Area */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} /> Danh sách gói hiện có
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packages.map((pkg: MealPackage) => (
              <Card
                key={pkg._id}
                className={`border-gray-100 shadow-sm transition-all rounded-xl overflow-hidden hover:border-orange-200 group flex flex-col ${!pkg.isActive ? "bg-gray-50/50 grayscale opacity-60" : "bg-white"}`}
              >
                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="p-6 space-y-4 flex-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-bold text-gray-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                          {pkg.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold px-1.5 h-4.5 rounded-md bg-gray-50 border-gray-100 text-gray-500"
                          >
                            {pkg.validDays} NGÀY
                          </Badge>
                        </div>
                      </div>

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
                          className="w-40 rounded-lg"
                        >
                          <DropdownMenuItem
                            onClick={() => handleEdit(pkg)}
                            className="cursor-pointer font-medium gap-2"
                          >
                            <Edit size={14} /> Sửa gói
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer font-medium text-rose-600 gap-2"
                            onClick={() => {
                              if (confirm("Xác nhận xóa gói cơm này?")) {
                                deleteMutation.mutate(pkg._id);
                              }
                            }}
                          >
                            <Trash2 size={14} /> Xóa gói
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-end justify-between pt-2">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                          Số lượt cơm
                        </p>
                        <p className="text-3xl font-black text-orange-600 italic">
                          {pkg.turns}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Giá niêm yết
                        </p>
                        <p className="text-xl font-bold text-orange-600">
                          {formatVND(pkg.price)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {pkg.isActive && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Đang được mở bán
                      </span>
                      <Check size={14} className="text-emerald-500" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar - Pending Requests */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <ShoppingBag size={14} /> Yêu cầu đang chờ
          </h2>

          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="p-10 text-center bg-gray-50/50 border border-dashed rounded-xl border-gray-200">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                  Trống trải
                </p>
              </div>
            ) : (
              pendingRequests.map((req: PackagePurchaseRequest) => {
                const user = req.userId as User;
                const pkg = req.mealPackageId as MealPackage;
                return (
                  <Card
                    key={req._id}
                    className="border-gray-100 shadow-sm overflow-hidden bg-white"
                  >
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 uppercase font-black text-gray-400 text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate uppercase tracking-tight">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg space-y-1 border border-gray-100/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                          Đăng ký:{" "}
                          <span className="text-gray-900">{pkg.name}</span>
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                          Số tiền:{" "}
                          <span className="text-orange-600">
                            {formatVND(pkg.price)}
                          </span>
                        </p>
                        <p className="text-[9px] text-gray-400 italic text-right mt-1">
                          {formatDate(req.requestedAt)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 border-gray-200 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 font-bold text-[11px] gap-1.5"
                          onClick={() => approveMutation.mutate(req._id)}
                          disabled={approveMutation.isPending}
                        >
                          <Check size={14} /> DUYỆT
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-[11px] gap-1.5"
                          onClick={() => rejectMutation.mutate(req._id)}
                          disabled={rejectMutation.isPending}
                        >
                          <X size={14} /> TỪ CHỐI
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-orange-500" size={20} />
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest leading-tight">
                Quy trình phê duyệt
              </h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Vui lòng kiểm tra kỹ bằng chứng chuyển khoản (nếu có) trước khi
              thực hiện lệnh{" "}
              <span className="text-emerald-600 font-bold">DUYỆT</span>. Hệ
              thống sẽ tự động cộng lượt và thời hạn cho thượng đế ngay lập tức.
            </p>
          </div>
        </div>
      </div>

      {/* Package Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl rounded-xl border-none shadow-2xl p-0 overflow-hidden bg-white">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/50">
              <DialogTitle className="text-xl font-bold text-orange-600 uppercase tracking-tight">
                {editingPackage ? "Cập nhật gói cơm" : "Tạo gói mới"}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Điền các chi tiết thông số cho gói dịch vụ suất ăn.
              </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                  Tên gói cơm
                </Label>
                <div className="relative group">
                  <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ví dụ: Gói Cơm Văn Phòng 10 Lượt"
                    className="h-11 pl-11 border-gray-200 focus:ring-1 focus:ring-orange-500 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    Số lượt suất ăn
                  </Label>
                  <div className="relative group">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                      type="number"
                      min={1}
                      value={formData.turns}
                      onChange={(e) =>
                        setFormData({ ...formData, turns: +e.target.value })
                      }
                      className="h-11 pl-11 border-gray-200 focus:ring-1 focus:ring-orange-500 rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    Hiệu lực (Ngày)
                  </Label>
                  <div className="relative group">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                      type="number"
                      min={1}
                      value={formData.validDays}
                      onChange={(e) =>
                        setFormData({ ...formData, turns: +e.target.value })
                      }
                      className="h-11 pl-11 border-gray-200 focus:ring-1 focus:ring-orange-500 rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                  Giá tiền dịch vụ (VND)
                </Label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-300 group-focus-within:text-orange-500 transition-colors">
                    ₫
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: +e.target.value })
                    }
                    className="h-11 pl-10 border-gray-200 focus:ring-1 focus:ring-orange-500 rounded-lg text-lg font-bold text-orange-600"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-8 border-t border-gray-50 bg-gray-50/20 gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={closeDialog}
                className="rounded-lg h-11 px-8 font-bold text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900"
              >
                HỦY BỎ
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white h-11 px-10 rounded-lg font-bold text-xs uppercase tracking-widest shadow-xl transition-all"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingPackage ? "LƯU THAY ĐỔI" : "XÁC NHẬN TẠO"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
