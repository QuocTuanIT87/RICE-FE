import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mealPackagesApi, packagePurchasesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVND, formatDateTime } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import { Package, Plus, Edit, Trash2, Check, X, Clock } from "lucide-react";
import type { MealPackage, User, PackagePurchaseRequest } from "@/types";

export default function AdminPackages() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
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

  const { data: packagesData } = useQuery({
    queryKey: ["adminMealPackages"],
    queryFn: () => mealPackagesApi.getPackages(),
  });

  const { data: requestsData } = useQuery({
    queryKey: ["adminPurchaseRequests", "pending"],
    queryFn: () => packagePurchasesApi.getAllRequests("pending"),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<MealPackage>) =>
      mealPackagesApi.createPackage(data),
    onSuccess: () => {
      toast({ title: "✅ Tạo gói thành công!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminMealPackages"] });
      resetForm();
    },
    onError: () => toast({ title: "❌ Có lỗi xảy ra", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MealPackage> }) =>
      mealPackagesApi.updatePackage(id, data),
    onSuccess: () => {
      toast({ title: "✅ Cập nhật thành công!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminMealPackages"] });
      resetForm();
    },
    onError: () => toast({ title: "❌ Có lỗi xảy ra", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mealPackagesApi.deletePackage(id),
    onSuccess: () => {
      toast({ title: "✅ Đã xóa gói!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminMealPackages"] });
    },
    onError: () => toast({ title: "❌ Có lỗi xảy ra", variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => packagePurchasesApi.approveRequest(id),
    onSuccess: () => {
      toast({ title: "✅ Đã xác nhận mua gói!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminPurchaseRequests"] });
    },
    onError: () => toast({ title: "❌ Có lỗi xảy ra", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => packagePurchasesApi.rejectRequest(id),
    onSuccess: () => {
      toast({ title: "✅ Đã từ chối yêu cầu!", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["adminPurchaseRequests"] });
    },
    onError: () => toast({ title: "❌ Có lỗi xảy ra", variant: "destructive" }),
  });

  const packages = packagesData?.data.data || [];
  const pendingRequests = requestsData?.data.data || [];

  const resetForm = () => {
    setShowForm(false);
    setEditingPackage(null);
    setFormData({
      name: "",
      turns: 1,
      price: 0,
      validDays: 7,
      qrCodeImage: "",
    });
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
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="text-orange-500" />
          Quản lý gói đặt cơm
        </h1>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm gói mới
        </Button>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="text-yellow-600" />
              Yêu cầu mua gói đang chờ ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((req: PackagePurchaseRequest) => {
                const user = req.userId as User;
                const pkg = req.mealPackageId as MealPackage;
                return (
                  <div
                    key={req._id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-sm">
                        {pkg.name} - {formatVND(pkg.price)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateTime(req.requestedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(req._id)}
                        disabled={approveMutation.isPending}
                        className="gap-1"
                      >
                        <Check className="w-4 h-4" /> Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectMutation.mutate(req._id)}
                        disabled={rejectMutation.isPending}
                        className="gap-1"
                      >
                        <X className="w-4 h-4" /> Từ chối
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPackage ? "Sửa gói" : "Thêm gói mới"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Tên gói</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Gói 5 lượt"
                  required
                />
              </div>
              <div>
                <Label>Số lượt</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.turns}
                  onChange={(e) =>
                    setFormData({ ...formData, turns: +e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Giá (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: +e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Hiệu lực (ngày)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.validDays}
                  onChange={(e) =>
                    setFormData({ ...formData, validDays: +e.target.value })
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label>Link ảnh QR (tùy chọn)</Label>
                <Input
                  value={formData.qrCodeImage}
                  onChange={(e) =>
                    setFormData({ ...formData, qrCodeImage: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingPackage ? "Cập nhật" : "Tạo gói"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Packages List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách gói ({packages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {packages.map((pkg: MealPackage) => (
              <div
                key={pkg._id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  pkg.isActive ? "bg-white" : "bg-gray-100 opacity-60"
                }`}
              >
                <div>
                  <p className="font-semibold">{pkg.name}</p>
                  <p className="text-sm text-gray-500">
                    {pkg.turns} lượt • {formatVND(pkg.price)} • {pkg.validDays}{" "}
                    ngày
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(pkg)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Xác nhận xóa gói này?")) {
                        deleteMutation.mutate(pkg._id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
