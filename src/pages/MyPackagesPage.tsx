import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { userPackagesApi, packagePurchasesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVND, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import {
  Package,
  Clock,
  Check,
  AlertCircle,
  Star,
  History,
} from "lucide-react";
import type { MealPackage } from "@/types";
import { useSocket } from "@/contexts/SocketContext";

export default function MyPackagesPage() {
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const { socket } = useSocket();

  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ["myPackages"],
    queryFn: () => userPackagesApi.getMyPackages(),
  });

  // Lắng nghe sự kiện real-time
  useEffect(() => {
    if (!socket) return;

    socket.on("purchase_request_approved", (data) => {
      console.log("Purchase approved:", data);
      toast({
        title: "🎉 Chúc mừng!",
        description: data.message || "Gói cơm của bạn đã được kích hoạt.",
        variant: "success",
      });
      // Làm mới toàn bộ dữ liệu liên quan
      queryClient.invalidateQueries({ queryKey: ["myPurchaseRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myPackages"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] }); // Để cập nhật activePackageId
    });

    socket.on("purchase_request_rejected", (data) => {
      console.log("Purchase rejected:", data);
      toast({
        title: "❌ Rất tiếc",
        description: data.message || "Yêu cầu mua gói của bạn bị từ chối.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["myPurchaseRequests"] });
    });

    return () => {
      socket.off("purchase_request_approved");
      socket.off("purchase_request_rejected");
    };
  }, [socket, queryClient]);

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
        <Card className="mb-6">
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
                    <p className="text-sm text-gray-500">
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

      {/* Lịch sử mua gói */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="text-blue-500" />
            Lịch sử mua gói ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>Bạn chưa có yêu cầu mua gói nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">
                      Ngày yêu cầu
                    </th>
                    <th className="text-left p-3 font-semibold">Tên gói</th>
                    <th className="text-left p-3 font-semibold">Loại</th>
                    <th className="text-right p-3 font-semibold">Giá</th>
                    <th className="text-center p-3 font-semibold">Số lượt</th>
                    <th className="text-center p-3 font-semibold">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...requests]
                    .sort(
                      (a, b) =>
                        new Date(b.requestedAt).getTime() -
                        new Date(a.requestedAt).getTime(),
                    )
                    .map((req) => {
                      const mealPkg = req.mealPackageId as MealPackage;

                      let status = "";
                      let statusClass = "";
                      if (req.status === "pending") {
                        status = "Đang chờ";
                        statusClass = "bg-yellow-100 text-yellow-700";
                      } else if (req.status === "approved") {
                        status = "Đã duyệt";
                        statusClass = "bg-green-100 text-green-700";
                      } else if (req.status === "rejected") {
                        status = "Từ chối";
                        statusClass = "bg-red-100 text-red-600";
                      }

                      return (
                        <tr key={req._id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-gray-600">
                            {formatDate(req.requestedAt)}
                          </td>
                          <td className="p-3 font-medium">
                            {mealPkg?.name || "N/A"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                mealPkg?.packageType === "normal"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {mealPkg?.packageType === "normal"
                                ? "Có cơm"
                                : "Không cơm"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-medium text-orange-600">
                            {mealPkg ? formatVND(mealPkg.price) : "N/A"}
                          </td>
                          <td className="p-3 text-center">
                            {mealPkg?.turns || "N/A"}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs ${statusClass}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
