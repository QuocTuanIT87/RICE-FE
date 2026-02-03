import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { mealPackagesApi, packagePurchasesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatVND } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import {
  ArrowLeft,
  Package,
  Clock,
  QrCode,
  CreditCard,
  ShoppingCart,
} from "lucide-react";

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["mealPackage", id],
    queryFn: () => mealPackagesApi.getPackageById(id!),
    enabled: !!id,
  });

  const purchaseMutation = useMutation({
    mutationFn: () => packagePurchasesApi.createRequest(id!),
    onSuccess: (response) => {
      toast({
        title: "✅ Đã gửi yêu cầu mua gói!",
        description:
          response.data.message || "Vui lòng chờ admin xác nhận thanh toán",
        variant: "success",
      });
      navigate("/my-packages");
    },
    onError: (error: any) => {
      toast({
        title: "❌ Lỗi!",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📦</div>
          <p className="text-gray-500">Đang tải thông tin gói...</p>
        </div>
      </div>
    );
  }

  const pkg = data?.data.data;

  if (!pkg) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">Không tìm thấy gói</h2>
          <Link to="/packages">
            <Button>Quay lại danh sách gói</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <Link
        to="/packages"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách gói
      </Link>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex items-center gap-4">
            <div className="text-6xl">
              {pkg.turns <= 1 ? "🍱" : pkg.turns <= 5 ? "🍲" : "🍳"}
            </div>
            <div>
              <CardTitle className="text-2xl">{pkg.name}</CardTitle>
              <CardDescription className="text-orange-100">
                {pkg.turns} lượt đặt cơm
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Package Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Package className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Số lượt</p>
                <p className="font-semibold text-lg">{pkg.turns} lượt</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Thời hạn</p>
                <p className="font-semibold text-lg">{pkg.validDays} ngày</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <CreditCard className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Giá gói</p>
                <p className="font-semibold text-lg text-orange-600">
                  {formatVND(pkg.price)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <ShoppingCart className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Giá mỗi lượt</p>
                <p className="font-semibold text-lg">
                  {formatVND(Math.round(pkg.price / pkg.turns))}
                </p>
              </div>
            </div>
          </div>

          {/* QR Code - Tạo QR động với số tiền và nội dung CK */}
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4 flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" />
              Quét mã QR để thanh toán
            </h3>
            {(() => {
              const bankCode = import.meta.env.VITE_BANK_CODE;
              const bankAccount = import.meta.env.VITE_BANK_ACCOUNT;

              if (bankCode && bankAccount) {
                // Tạo QR động với số tiền và nội dung
                const transferContent = `DATCOM ${pkg.name}`.replace(
                  /\s+/g,
                  " ",
                );
                const qrUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${pkg.price}&addInfo=${encodeURIComponent(transferContent)}`;

                return (
                  <img
                    src={qrUrl}
                    alt="QR Thanh toán"
                    className="mx-auto max-w-xs rounded-lg shadow"
                  />
                );
              }

              return (
                <div className="mx-auto w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-center px-4">
                    Liên hệ admin để được hướng dẫn thanh toán
                  </p>
                </div>
              );
            })()}
            <div className="mt-4 text-sm text-gray-600 space-y-1">
              <p>
                <strong>Nội dung CK:</strong> MUA GOI DAT COM {pkg.name}
              </p>
              <p>
                <strong className="font-bold">Số tiền:</strong>{" "}
                {formatVND(pkg.price)}
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Sau khi chuyển khoản, nhấn nút "Mua gói" bên dưới
            </p>
          </div>

          {/* Buy Button */}
          <Button
            size="lg"
            className="w-full text-lg py-6"
            onClick={() => purchaseMutation.mutate()}
            disabled={purchaseMutation.isPending}
          >
            {purchaseMutation.isPending ? (
              <span>Đang xử lý...</span>
            ) : (
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                MUA GÓI - {formatVND(pkg.price)}
              </span>
            )}
          </Button>

          {/* Note */}
          <p className="text-center text-sm text-gray-500">
            Sau khi mua, admin sẽ xác nhận thanh toán và gói sẽ được kích hoạt!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
