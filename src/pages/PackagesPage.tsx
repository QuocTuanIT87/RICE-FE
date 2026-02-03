import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { mealPackagesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatVND } from "@/lib/utils";
import { Package, Clock, ArrowRight, Star } from "lucide-react";
import type { MealPackage } from "@/types";

export default function PackagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["mealPackages", true],
    queryFn: () => mealPackagesApi.getPackages(true),
  });

  const allPackages = data?.data.data || [];

  // Phân loại gói theo packageType
  const normalPackages = allPackages.filter(
    (pkg) => pkg.packageType === "normal" || !pkg.packageType,
  );
  const noRicePackages = allPackages.filter(
    (pkg) => pkg.packageType === "no-rice",
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📦</div>
          <p className="text-gray-500">Đang tải gói...</p>
        </div>
      </div>
    );
  }

  const PackageGrid = ({
    packages,
    type,
  }: {
    packages: MealPackage[];
    type: "normal" | "no-rice";
  }) => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg, index) => (
        <Card
          key={pkg._id}
          className={`card-hover relative overflow-hidden ${
            index === Math.floor(packages.length / 2)
              ? type === "normal"
                ? "border-orange-500 border-2"
                : "border-blue-500 border-2"
              : ""
          }`}
        >
          {/* Popular badge */}
          {index === Math.floor(packages.length / 2) && (
            <div
              className={`absolute top-0 right-0 ${
                type === "normal" ? "bg-orange-500" : "bg-blue-500"
              } text-white px-3 py-1 text-sm font-medium rounded-bl-lg flex items-center gap-1`}
            >
              <Star className="w-3 h-3" fill="white" />
              Phổ biến
            </div>
          )}

          <CardHeader className="text-center pb-2">
            <div className="text-5xl mb-2">
              {type === "normal"
                ? pkg.turns <= 1
                  ? "🍱"
                  : pkg.turns <= 5
                    ? "🍲"
                    : "🍳"
                : pkg.turns <= 1
                  ? "🥢"
                  : pkg.turns <= 5
                    ? "🍜"
                    : "🥗"}
            </div>
            <CardTitle className="text-xl">{pkg.name}</CardTitle>
            <CardDescription className="text-lg">
              {pkg.turns} lượt đặt {type === "no-rice" ? "(không cơm)" : "cơm"}
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center">
            <p
              className={`text-3xl font-bold mb-2 ${
                type === "normal" ? "text-orange-600" : "text-blue-600"
              }`}
            >
              {formatVND(pkg.price)}
            </p>
            <p className="text-sm text-gray-500 mb-1">
              ≈ {formatVND(Math.round(pkg.price / pkg.turns))}/lượt
            </p>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-4">
              <Clock className="w-4 h-4" />
              <span>Hiệu lực: {pkg.validDays} ngày</span>
            </div>

            <Link to={`/packages/${pkg._id}`}>
              <Button
                className={`w-full gap-2 ${
                  type === "no-rice" ? "bg-blue-600 hover:bg-blue-700" : ""
                }`}
              >
                Mua ngay <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Package className="text-orange-500" />
          Các gói đặt cơm
        </h1>
        <p className="text-gray-600">
          Chọn gói phù hợp với nhu cầu của bạn. Mua gói nhiều lượt sẽ tiết kiệm
          hơn!
        </p>
      </div>

      {/* Tabs phân loại gói */}
      <Tabs defaultValue="normal" className="mb-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="normal" className="gap-2">
            🍚 Có cơm
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-3 rounded-full">
              30k/phần
            </span>
          </TabsTrigger>
          <TabsTrigger value="no-rice" className="gap-2">
            🥢 Không cơm
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-3 rounded-full">
              20k/phần
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="normal" className="mt-6">
          <Card className="mb-6 bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <p className="text-orange-800">
                🍚 <strong>Gói có cơm:</strong> Mỗi lượt đặt = 1 suất cơm trắng
                kèm món ăn (30,000đ/phần)
              </p>
            </CardContent>
          </Card>
          <PackageGrid packages={normalPackages} type="normal" />
        </TabsContent>

        <TabsContent value="no-rice" className="mt-6">
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-blue-800">
                🥢 <strong>Gói không cơm:</strong> Mỗi lượt đặt = 1 phần món ăn,
                không lấy cơm (20,000đ/phần)
              </p>
            </CardContent>
          </Card>
          <PackageGrid packages={noRicePackages} type="no-rice" />
        </TabsContent>
      </Tabs>

      {/* Info */}
      <Card className="mt-8 bg-gray-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">📌 Lưu ý:</h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li>
              • <strong>Gói có cơm:</strong> 30,000đ/lượt - đặt món kèm cơm
              trắng
            </li>
            <li>
              • <strong>Gói không cơm:</strong> 20,000đ/lượt - chỉ đặt món ăn
            </li>
            <li>
              • Gói sẽ hết hạn sau số ngày quy định kể từ khi được xác nhận
            </li>
            <li>• Sau khi mua, vui lòng chờ admin xác nhận thanh toán</li>
            <li>• Bạn có thể sở hữu nhiều gói cùng lúc (cả 2 loại)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
