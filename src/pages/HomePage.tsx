import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";
import { mealPackagesApi, dailyMenusApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatVND } from "@/lib/utils";
import {
  UtensilsCrossed,
  Package,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const { data: packages } = useQuery({
    queryKey: ["mealPackages"],
    queryFn: () => mealPackagesApi.getPackages(true),
  });

  const { data: todayMenu } = useQuery({
    queryKey: ["todayMenu"],
    queryFn: () => dailyMenusApi.getTodayMenu(),
  });

  const activePackages = packages?.data.data || [];
  const menus = todayMenu?.data.data || [];
  const menu = menus.length > 0 ? menus[0] : null;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 animate-fade-in">
        <h1 className="text-5xl font-bold mb-4">
          <span className="gradient-text">Đặt cơm</span> nhanh chóng 🍚
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Hệ thống đặt cơm trực tuyến tiện lợi. Mua gói đặt cơm theo lượt, tiết
          kiệm thời gian mỗi ngày!
        </p>
        <div className="flex justify-center gap-4">
          {isAuthenticated ? (
            <Link to="/order">
              <Button size="lg" className="gap-2">
                <UtensilsCrossed className="w-5 h-5" />
                Đặt cơm ngay
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  Bắt đầu ngay
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Đăng nhập
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Today's Menu */}
      {menu && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="text-orange-500" />
                Menu hôm nay
              </h2>
              <p className="text-gray-600">
                Thời gian đặt: {menu.beginAt} - {menu.endAt}
              </p>
            </div>
            <Link to="/order">
              <Button className="gap-2">
                Đặt ngay <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {menu.menuItems?.slice(0, 12).map((item) => (
                  <span
                    key={item._id}
                    className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                  >
                    {item.name}
                  </span>
                ))}
                {(menu.menuItems?.length || 0) > 12 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    +{(menu.menuItems?.length || 0) - 12} món khác
                  </span>
                )}
              </div>
              {!menu.canOrder && (
                <p className="mt-4 text-yellow-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Hiện tại ngoài thời gian đặt cơm
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Packages */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-orange-500" />
            Các gói đặt cơm
          </h2>
          <Link to="/packages">
            <Button variant="outline" className="gap-2">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {activePackages.slice(0, 5).map((pkg) => (
            <Card key={pkg._id} className="card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <CardDescription>{pkg.turns} lượt đặt cơm</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600 mb-2">
                  {formatVND(pkg.price)}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Hiệu lực: {pkg.validDays} ngày
                </p>
                <Link to={isAuthenticated ? `/packages/${pkg._id}` : "/login"}>
                  <Button variant="outline" className="w-full">
                    Mua ngay
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl text-white">
        <div className="text-center px-8">
          <h2 className="text-3xl font-bold mb-8">Tại sao chọn chúng tôi?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Nhanh chóng</h3>
              <p className="text-orange-100">Đặt cơm chỉ với vài click</p>
            </div>
            <div>
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Tiết kiệm</h3>
              <p className="text-orange-100">Mua gói lượt giá tốt hơn</p>
            </div>
            <div>
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Tiện lợi</h3>
              <p className="text-orange-100">Đặt mọi lúc, mọi nơi</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
