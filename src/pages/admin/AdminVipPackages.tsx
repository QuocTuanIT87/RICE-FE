import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vipPackagesApi, depositRequestsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { formatVND, formatDate, cn } from "@/lib/utils";
import { Crown, Edit2, Plus, Trash2, CheckCircle2, XCircle, Loader2, History } from "lucide-react";
import { VipPackage } from "@/types";
import Swal from "sweetalert2";

export default function AdminVipPackages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tab State
  const [activeTab, setActiveTab] = useState<string>("approval");

  // VIP Package state & mutations
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<VipPackage | null>(null);

  // Form states for VIP Package
  const [name, setName] = useState("");
  const [price, setPrice] = useState(30000);
  const [discountAmount, setDiscountAmount] = useState(2000);
  const [validDays, setValidDays] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [features, setFeatures] = useState("");

  // Approval tab states
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [approvalPage, setApprovalPage] = useState<number>(1);
  const approvalLimit = 10;

  // Fetch all packages
  const { data: packagesResponse, isLoading: packagesLoading } = useQuery({
    queryKey: ["adminVipPackages"],
    queryFn: () => vipPackagesApi.getAllPackages(),
  });
  const packages = packagesResponse?.data.data || [];

  // Fetch VIP requests
  const { data: vipRequestsData, isLoading: vipRequestsLoading } = useQuery({
    queryKey: ["adminVipRequests", filterStatus, approvalPage],
    queryFn: () =>
      depositRequestsApi.getAllRequests({
        status: filterStatus || undefined,
        requestType: "buy_membership",
        page: approvalPage,
        limit: approvalLimit,
      }),
  });
  const vipRequestsResponse = vipRequestsData?.data.data;
  const vipRequests = vipRequestsResponse?.docs || [];
  const totalApprovalPages = vipRequestsResponse?.pages || 1;

  // Reset form
  const resetForm = () => {
    setName("");
    setPrice(30000);
    setDiscountAmount(2000);
    setValidDays(30);
    setIsActive(true);
    setFeatures("");
    setEditingPackage(null);
  };

  // Open Dialog for Creating
  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open Dialog for Editing
  const handleOpenEdit = (pkg: VipPackage) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setPrice(pkg.price);
    setDiscountAmount(pkg.discountAmount);
    setValidDays(pkg.validDays);
    setIsActive(pkg.isActive);
    setFeatures(pkg.features.join(", "));
    setIsDialogOpen(true);
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<VipPackage>) => vipPackagesApi.createPackage(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["adminVipPackages"] });
      queryClient.invalidateQueries({ queryKey: ["vipPackages"] });
      setIsDialogOpen(false);
      toast({
        title: "Thành công!",
        description: res.data.message || "Đã tạo gói VIP mới thành công",
      });
      resetForm();
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi tạo gói",
        description: err.response?.data?.error?.message || "Đã xảy ra lỗi, vui lòng thử lại.",
      });
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VipPackage> }) =>
      vipPackagesApi.updatePackage(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["adminVipPackages"] });
      queryClient.invalidateQueries({ queryKey: ["vipPackages"] });
      setIsDialogOpen(false);
      toast({
        title: "Thành công!",
        description: res.data.message || "Đã cập nhật gói VIP thành công",
      });
      resetForm();
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật",
        description: err.response?.data?.error?.message || "Đã xảy ra lỗi, vui lòng thử lại.",
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vipPackagesApi.deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminVipPackages"] });
      queryClient.invalidateQueries({ queryKey: ["vipPackages"] });
      toast({
        title: "Đã xóa!",
        description: "Đã xóa gói VIP thành công",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi xóa gói",
        description: err.response?.data?.error?.message || "Không thể xóa gói này.",
      });
    },
  });

  const handleApprove = async (id: string) => {
    if (!window.confirm("Đạo hữu có chắc chắn muốn DUYỆT yêu cầu kích hoạt VIP này?")) return;
    try {
      const res = await depositRequestsApi.approveRequest(id);
      toast({
        title: "Duyệt thành công!",
        description: res.data.message || "Đã kích hoạt VIP cho người dùng.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["adminVipRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    } catch (error: any) {
      toast({
        title: "Lỗi phê duyệt",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Đạo hữu có chắc chắn muốn TỪ CHỐI yêu cầu mua VIP này?")) return;
    try {
      const res = await depositRequestsApi.rejectRequest(id);
      toast({
        title: "Từ chối thành công!",
        description: res.data.message || "Đã từ chối yêu cầu.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["adminVipRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    } catch (error: any) {
      toast({
        title: "Lỗi từ chối",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (pkg: VipPackage) => {
    Swal.fire({
      title: "Xóa Gói VIP?",
      text: `Đạo hữu có chắc chắn muốn xóa gói "${pkg.name}"? Hành động này không thể hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý xóa",
      cancelButtonText: "Hủy bỏ",
      customClass: {
        confirmButton: "swal2-confirm swal2-styled",
        cancelButton: "swal2-cancel swal2-styled",
      },
    }).then((result: any) => {
      if (result.isConfirmed && pkg._id) {
        deleteMutation.mutate(pkg._id);
      }
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên gói VIP",
      });
      return;
    }

    const featureList = features
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f !== "");

    const payload = {
      name: name.trim(),
      price,
      discountAmount,
      validDays,
      isActive,
      features: featureList,
    };

    if (editingPackage && editingPackage._id) {
      updateMutation.mutate({ id: editingPackage._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            Quản lý Gói Hội Viên & Duyệt VIP
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập các gói VIP và phê duyệt các yêu cầu mua gói VIP từ người dùng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-orange-100 text-orange-700 border-none font-bold uppercase tracking-wider text-[10px] py-1 px-3">
            Admin Mode
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-1 rounded-2xl h-11 max-w-[400px]">
          <TabsTrigger value="approval" className="rounded-xl font-bold text-xs md:text-sm py-2">
            DUYỆT YÊU CẦU MUA
          </TabsTrigger>
          <TabsTrigger value="packages" className="rounded-xl font-bold text-xs md:text-sm py-2">
            DANH SÁCH GÓI
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: DUYỆT YÊU CẦU MUA GÓI VIP */}
        <TabsContent value="approval" className="space-y-6 mt-0">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "pending", label: "Chờ duyệt", color: "amber" },
              { key: "approved", label: "Đã duyệt", color: "emerald" },
              { key: "rejected", label: "Đã từ chối", color: "rose" },
              { key: "", label: "Tất cả", color: "gray" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setFilterStatus(tab.key);
                  setApprovalPage(1);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  filterStatus === tab.key
                    ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-100"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Card className="border border-gray-100 shadow-sm overflow-hidden">
            {vipRequestsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : vipRequests.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-2">
                <History size={48} className="mx-auto text-gray-300" />
                <p className="font-bold text-sm">Không tìm thấy yêu cầu mua VIP nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="text-left px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">
                        Gói VIP đăng ký
                      </th>
                      <th className="text-left px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">
                        Giá gói (Thanh toán)
                      </th>
                      <th className="text-left px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">
                        Ngày yêu cầu
                      </th>
                      <th className="text-center px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="text-right px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vipRequests.map((req: any) => {
                      const reqUser = req.userId || {};
                      const vipPkg = req.vipPackageId || {};

                      const statusColors = {
                        pending: "bg-amber-50 text-amber-700 border border-amber-200",
                        approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        rejected: "bg-rose-50 text-rose-600 border border-rose-200",
                      }[req.status as string] || "bg-gray-50 text-gray-600";

                      const statusLabels = {
                        pending: "Chờ duyệt",
                        approved: "Đã duyệt",
                        rejected: "Từ chối",
                      }[req.status as string] || req.status;

                      return (
                        <tr key={req._id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{reqUser.name || "N/A"}</span>
                              <span className="text-[11px] text-gray-400 font-medium">{reqUser.email || "N/A"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-bold border-none text-xs rounded-xl px-3 py-1 flex items-center gap-1 w-max">
                              <Crown size={12} className="text-amber-600" />
                              {vipPkg.name || "Gói Hội Viên"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-black text-orange-600 text-sm">
                            {formatVND(req.amount)}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {formatDate(req.requestedAt)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${statusColors}`}>
                              {statusLabels}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {req.status === "pending" ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  onClick={() => handleApprove(req._id)}
                                  size="sm"
                                  className="h-8 px-3 rounded-lg font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white gap-1"
                                >
                                  <CheckCircle2 size={12} /> Duyệt
                                </Button>
                                <Button
                                  onClick={() => handleReject(req._id)}
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 rounded-lg font-bold text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1"
                                >
                                  <XCircle size={12} /> Từ chối
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Xử lý bởi: {req.processedBy?.name || "Hệ thống"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Pagination */}
          {totalApprovalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                onClick={() => setApprovalPage((p) => Math.max(1, p - 1))}
                disabled={approvalPage === 1}
                size="sm"
                variant="outline"
                className="rounded-lg font-bold"
              >
                Trước
              </Button>
              <span className="text-xs font-bold text-gray-500 px-3">
                Trang {approvalPage} / {totalApprovalPages}
              </span>
              <Button
                onClick={() => setApprovalPage((p) => Math.min(totalApprovalPages, p + 1))}
                disabled={approvalPage === totalApprovalPages}
                size="sm"
                variant="outline"
                className="rounded-lg font-bold"
              >
                Sau
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: DANH SÁCH GÓI VIP */}
        <TabsContent value="packages" className="space-y-6 mt-0">
          <div className="flex justify-end">
            <Button
              onClick={handleOpenAdd}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-md shadow-orange-200"
            >
              <Plus size={16} />
              Thêm gói mới
            </Button>
          </div>

          <Card className="border border-gray-100 shadow-sm overflow-hidden">
            {packagesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-2">
                <Crown size={48} className="mx-auto text-gray-300" />
                <p className="font-bold text-sm">Chưa cấu hình gói VIP nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                      <TableHead className="font-bold text-gray-700">Tên gói</TableHead>
                      <TableHead className="font-bold text-gray-700">Giá bán</TableHead>
                      <TableHead className="font-bold text-gray-700">Giảm giá/phần cơm</TableHead>
                      <TableHead className="font-bold text-gray-700">Thời hạn</TableHead>
                      <TableHead className="font-bold text-gray-700">Trạng thái</TableHead>
                      <TableHead className="text-right font-bold text-gray-700">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg._id} className="hover:bg-gray-50/30">
                        <TableCell className="font-bold text-gray-900">{pkg.name}</TableCell>
                        <TableCell className="font-black text-orange-600">{formatVND(pkg.price)}</TableCell>
                        <TableCell className="font-bold text-emerald-600">-{formatVND(pkg.discountAmount)}</TableCell>
                        <TableCell className="font-medium text-gray-500">{pkg.validDays} ngày</TableCell>
                        <TableCell>
                          <Badge className={cn("border-none text-[10px] font-bold px-2 py-0.5 rounded-lg", pkg.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                            {pkg.isActive ? "Đang bán" : "Tạm ẩn"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(pkg)}
                              className="h-8 w-8 rounded-lg text-gray-500 hover:text-orange-500 hover:bg-orange-50"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(pkg)}
                              className="h-8 w-8 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* CRUD Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                <Crown className="text-amber-500" />
                {editingPackage ? "Cập nhật gói VIP" : "Tạo gói VIP mới"}
              </DialogTitle>
              <DialogDescription>
                Thiết lập phí dịch vụ, mức chiết khấu và quyền lợi của gói VIP.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="pkg-name" className="font-bold text-gray-700">Tên gói VIP</Label>
                <Input
                  id="pkg-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Gói Tiết Kiệm Tháng (30 Ngày)"
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pkg-price" className="font-bold text-gray-700">Giá mua (VNĐ)</Label>
                  <Input
                    id="pkg-price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min={0}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pkg-discount" className="font-bold text-gray-700">Giảm giá/phần (VNĐ)</Label>
                  <Input
                    id="pkg-discount"
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    min={0}
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="grid gap-2">
                  <Label htmlFor="pkg-days" className="font-bold text-gray-700">Số ngày hiệu lực</Label>
                  <Input
                    id="pkg-days"
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    min={1}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="flex items-center justify-between border border-gray-100 rounded-xl p-3 bg-gray-50/50 mt-5">
                  <span className="text-sm font-bold text-gray-700">Trạng thái bán</span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pkg-features" className="font-bold text-gray-700">
                  Đặc quyền hiển thị (Cách nhau bằng dấu phẩy)
                </Label>
                <textarea
                  id="pkg-features"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Giảm 2.000đ/phần cơm, Mở khóa VIP Theme, Khung Avatar, Huy hiệu VIP diễn đàn..."
                  rows={3}
                  className="w-full text-sm rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl border-gray-200 text-gray-500 font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
              >
                {editingPackage ? "Lưu thay đổi" : "Tạo gói VIP"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
