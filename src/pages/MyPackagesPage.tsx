import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { userPackagesApi, packagePurchasesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { formatVND, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  History,
  RefreshCw,
  Loader2,
  ShoppingBag,
  CalendarClock,
  Zap,
} from "lucide-react";
import type { MealPackage } from "@/types";
import { useSocket } from "@/contexts/SocketContext";

export default function MyPackagesPage() {
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const { socket } = useSocket();

  const {
    data: packagesData,
    isLoading: packagesLoading,
    refetch: refetchPkgs,
    isFetching: isFetchingPkgs,
  } = useQuery({
    queryKey: ["myPackages"],
    queryFn: () => userPackagesApi.getMyPackages(),
  });

  useEffect(() => {
    if (!socket) return;
    const handleApproved = (data: any) => {
      toast({
        title: "🎉 Chúc mừng!",
        description: data.message || "Gói cơm của bạn đã được kích hoạt.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["myPurchaseRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myPackages"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    };
    const handleRejected = (data: any) => {
      toast({
        title: "❌ Rất tiếc",
        description: data.message || "Yêu cầu mua gói của bạn bị từ chối.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["myPurchaseRequests"] });
    };
    socket.on("purchase_request_approved", handleApproved);
    socket.on("purchase_request_rejected", handleRejected);
    return () => {
      socket.off("purchase_request_approved", handleApproved);
      socket.off("purchase_request_rejected", handleRejected);
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
      toast({ title: "✅ Đã đặt làm gói mặc định", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["myPackages"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: () => {
      toast({ title: "❌ Có lỗi xảy ra", variant: "destructive" });
    },
  });

  const packages = packagesData?.data.data || [];
  const requests = requestsData?.data.data || [];

  const activePackages = packages
    .filter(
      (p) =>
        p.isActive &&
        p.remainingTurns > 0 &&
        new Date(p.expiresAt) > new Date(),
    )
    .sort((a, b) => {
      const aIsDefault = user?.activePackage?._id === a._id ? -1 : 0;
      const bIsDefault = user?.activePackage?._id === b._id ? -1 : 0;
      return aIsDefault - bIsDefault;
    });
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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-1">
            Quản lý
          </p>
          <h1 className="text-2xl font-black text-gray-900">
            Gói đặt cơm của tôi
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/packages">
            <Button
              variant="outline"
              className="rounded-xl font-bold text-sm gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <ShoppingBag size={16} />
              Mua thêm gói
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetchPkgs()}
            disabled={isFetchingPkgs}
            className="h-10 w-10 rounded-xl bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200"
          >
            <RefreshCw
              size={16}
              className={isFetchingPkgs ? "animate-spin" : ""}
            />
          </Button>
        </div>
      </div>

      {/* ========== Pending Requests ========== */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200 flex items-center gap-2">
            <Clock size={18} className="text-amber-600" />
            <h2 className="font-bold text-amber-900">
              Đang chờ xác nhận ({pendingRequests.length})
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {pendingRequests.map((req) => {
              const pkg = req.mealPackageId as MealPackage;
              return (
                <div
                  key={req._id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Clock size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {pkg.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatVND(pkg.price)} • {pkg.turns} lượt
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                    ⏳ Chờ xác nhận
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== Active Packages ========== */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <h2 className="font-bold text-gray-900">Gói đang khả dụng</h2>
            <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
              {activePackages.length}
            </span>
          </div>
        </div>

        <div className="p-4">
          {activePackages.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Package size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Bạn chưa có gói nào khả dụng
              </p>
              <Link to="/packages">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold gap-2">
                  <ShoppingBag size={16} />
                  Mua gói ngay
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activePackages.map((pkg) => {
                const mealPkg = pkg.mealPackageId as MealPackage;
                const isDefault = user?.activePackage?._id === pkg._id;
                const percent = Math.round(
                  (pkg.remainingTurns / mealPkg.turns) * 100,
                );
                const isNoRice = mealPkg.packageType === "no-rice";
                const color = isNoRice ? "blue" : "orange";

                return (
                  <div
                    key={pkg._id}
                    className={`rounded-xl border-2 overflow-hidden transition-all ${
                      isDefault
                        ? `border-${color}-400 shadow-md shadow-${color}-50`
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    {/* Default badge */}
                    {isDefault && (
                      <div
                        className={`bg-gradient-to-r from-${color}-500 to-${color === "orange" ? "red" : "indigo"}-500 px-4 py-1.5 flex items-center gap-1.5`}
                      >
                        <Star size={12} fill="white" className="text-white" />
                        <span className="text-white text-xs font-black uppercase tracking-wider">
                          Gói mặc định
                        </span>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div
                            className={`w-12 h-12 shrink-0 bg-${color}-50 rounded-xl flex items-center justify-center`}
                          >
                            <Zap size={22} className={`text-${color}-500`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {mealPkg.name}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Package size={12} />
                                Còn {pkg.remainingTurns}/{mealPkg.turns} lượt
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarClock size={12} />
                                {formatDate(pkg.expiresAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {!isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveMutation.mutate(pkg._id)}
                            disabled={setActiveMutation.isPending}
                            className={`shrink-0 rounded-lg text-xs font-bold border-${color}-200 text-${color}-600 hover:bg-${color}-50`}
                          >
                            <Star size={12} className="mr-1" />
                            Đặt mặc định
                          </Button>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-gray-400 font-medium">
                            Lượt còn lại
                          </span>
                          <span
                            className={`text-[11px] font-bold text-${color}-600`}
                          >
                            {percent}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`bg-gradient-to-r from-${color}-400 to-${color === "orange" ? "red" : "indigo"}-400 h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========== Inactive Packages ========== */}
      {inactivePackages.length > 0 && (
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
              <AlertCircle size={16} className="text-gray-500" />
            </div>
            <h2 className="font-bold text-gray-500">Hết hạn / hết lượt</h2>
            <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-bold">
              {inactivePackages.length}
            </span>
          </div>
          <div className="p-4 space-y-2">
            {inactivePackages.map((pkg) => {
              const mealPkg = pkg.mealPackageId as MealPackage;
              return (
                <div
                  key={pkg._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                      <Package size={18} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-700 text-sm">
                        {mealPkg.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pkg.remainingTurns} lượt còn • Hết hạn{" "}
                        {formatDate(pkg.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-bold">
                    Hết hạn
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== Purchase History ========== */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <History size={16} className="text-blue-600" />
          </div>
          <h2 className="font-bold text-gray-900">Lịch sử mua gói</h2>
          <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
            {requests.length}
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <History size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">
              Bạn chưa có yêu cầu mua gói nào
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Tên gói
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="text-right px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="text-center px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Lượt
                  </th>
                  <th className="text-center px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
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

                    const statusConfig = {
                      pending: {
                        label: "Đang chờ",
                        class:
                          "bg-amber-100 text-amber-700 border border-amber-200",
                      },
                      approved: {
                        label: "Đã duyệt",
                        class:
                          "bg-emerald-100 text-emerald-700 border border-emerald-200",
                      },
                      rejected: {
                        label: "Từ chối",
                        class: "bg-red-100 text-red-600 border border-red-200",
                      },
                    }[req.status] || {
                      label: req.status,
                      class: "bg-gray-100 text-gray-600",
                    };

                    return (
                      <tr
                        key={req._id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {formatDate(req.requestedAt)}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-gray-900 text-sm">
                          {mealPkg?.name || "N/A"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              mealPkg?.packageType === "no-rice"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-orange-50 text-orange-600"
                            }`}
                          >
                            {mealPkg?.packageType === "no-rice"
                              ? "🥢 Không cơm"
                              : "🍚 Có cơm"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-orange-600 text-sm">
                          {mealPkg ? formatVND(mealPkg.price) : "N/A"}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-gray-700">
                          {mealPkg?.turns || "N/A"}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${statusConfig.class}`}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
