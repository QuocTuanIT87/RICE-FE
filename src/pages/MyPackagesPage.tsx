import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { userPackagesApi, packagePurchasesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVND, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import { Package, Clock, Check, AlertCircle, Star } from "lucide-react";
import type { MealPackage } from "@/types";

export default function MyPackagesPage() {
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ["myPackages"],
    queryFn: () => userPackagesApi.getMyPackages(),
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["myPurchaseRequests"],
    queryFn: () => packagePurchasesApi.getMyRequests(),
  });

  const setActiveMutation = useMutation({
    mutationFn: (packageId: string) =>
      userPackagesApi.setActivePackage(packageId),
    onSuccess: () => {
      toast({
        title: "✅ Đã đặt làm gói mặc định",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["myPackages"] });
    },
    onError: () => {
      toast({
        title: "❌ Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const packages = packagesData?.data.data || [];
  const requests = requestsData?.data.data || [];

  const activePackages = packages.filter(
    (p) =>
      p.isActive && p.remainingTurns > 0 && new Date(p.expiresAt) > new Date(),
  );
  const inactivePackages = packages.filter(
    (p) =>
      !p.isActive ||
      p.remainingTurns <= 0 ||
      new Date(p.expiresAt) <= new Date(),
  );

  const pendingRequests = requests.filter((r) => r.status === "pending");

  const isLoading = packagesLoading || requestsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📦</div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="text-orange-500" />
        Gói đặt cơm của tôi
      </h1>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="text-yellow-600" />
              Đang chờ xác nhận ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingRequests.map((req) => {
                const pkg = req.mealPackageId as MealPackage;
                return (
                  <div
                    key={req._id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatVND(pkg.price)} - {pkg.turns} lượt
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm">
                      Chờ xác nhận
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Packages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="text-green-500" />
            Gói đang khả dụng ({activePackages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activePackages.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p className="mb-4">Bạn chưa có gói nào khả dụng</p>
              <Link to="/packages">
                <Button>Mua gói ngay</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activePackages.map((pkg) => {
                const mealPkg = pkg.mealPackageId as MealPackage;
                const isDefault = user?.activePackage?._id === pkg._id;
                return (
                  <div
                    key={pkg._id}
                    className={`p-4 rounded-lg border-2 ${
                      isDefault
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          {mealPkg.name}
                          {isDefault && (
                            <span className="flex items-center gap-1 text-orange-600 text-sm">
                              <Star className="w-4 h-4" fill="currentColor" />
                              Mặc định
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          Còn {pkg.remainingTurns} / {mealPkg.turns} lượt
                        </p>
                        <p className="text-sm text-gray-500">
                          Hết hạn: {formatDate(pkg.expiresAt)}
                        </p>
                      </div>
                      {!isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveMutation.mutate(pkg._id)}
                          disabled={setActiveMutation.isPending}
                        >
                          Đặt làm mặc định
                        </Button>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${(pkg.remainingTurns / mealPkg.turns) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Packages */}
      {inactivePackages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-500">
              <AlertCircle />
              Gói đã hết hạn / hết lượt ({inactivePackages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 opacity-60">
              {inactivePackages.map((pkg) => {
                const mealPkg = pkg.mealPackageId as MealPackage;
                return (
                  <div key={pkg._id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{mealPkg.name}</p>
                    <p className="text-sc text-gray-500">
                      {pkg.remainingTurns} lượt còn - Hết hạn:{" "}
                      {formatDate(pkg.expiresAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
