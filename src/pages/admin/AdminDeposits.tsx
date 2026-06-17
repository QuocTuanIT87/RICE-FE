import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { depositRequestsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatVND, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import {
  History,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminDeposits() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["adminDepositRequests", filterStatus, page],
    queryFn: () =>
      depositRequestsApi.getAllRequests({
        status: filterStatus || undefined,
        page,
        limit,
      }),
  });

  const handleApprove = async (id: string) => {
    if (!window.confirm("Đạo hữu có chắc chắn muốn DUYỆT yêu cầu nạp tiền này?")) return;
    try {
      const res = await depositRequestsApi.approveRequest(id);
      toast({
        title: "Duyệt thành công!",
        description: res.data.message || "Đã cộng số dư cho khách.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["adminDepositRequests"] });
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
    if (!window.confirm("Đạo hữu có chắc chắn muốn TỪ CHỐI yêu cầu nạp tiền này?")) return;
    try {
      const res = await depositRequestsApi.rejectRequest(id);
      toast({
        title: "Từ chối thành công!",
        description: res.data.message || "Đã từ chối yêu cầu nạp.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["adminDepositRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    } catch (error: any) {
      toast({
        title: "Lỗi từ chối",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra.",
        variant: "destructive",
      });
    }
  };

  const responseData = data?.data.data;
  const requests = responseData?.docs || [];
  const totalPages = responseData?.pages || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            Phê duyệt nạp tiền
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Xem và phê duyệt các yêu cầu nạp tiền ví từ người dùng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </Button>
          <Badge className="bg-orange-100 text-orange-700 border-none font-bold uppercase tracking-wider text-[10px] py-1 px-3">
            Admin Mode
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
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
              setPage(1);
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

      {/* Requests Table Card */}
      <Card className="border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <History size={48} className="mx-auto text-gray-300" />
            <p className="font-bold text-sm">Không tìm thấy yêu cầu nạp tiền nào</p>
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
                    Số tiền yêu cầu
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
                {requests.map((req: any) => {
                  const reqUser = req.userId || {};
                  
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
                      <td className="px-6 py-4 font-black text-emerald-600 text-sm">
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
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            size="sm"
            variant="outline"
            className="rounded-lg font-bold"
          >
            Trước
          </Button>
          <span className="text-xs font-bold text-gray-500 px-3">
            Trang {page} / {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            size="sm"
            variant="outline"
            className="rounded-lg font-bold"
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
