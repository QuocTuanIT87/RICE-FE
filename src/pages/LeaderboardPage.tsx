import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/services/api";
import { Trophy, Medal, Coins, ShoppingBag, Crown } from "lucide-react";
import { formatVND } from "@/lib/utils";

type TabType = "turns" | "coins" | "orders";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("turns");

  const { data: turnsData, isLoading: loadingTurns } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => usersApi.getLeaderboard(),
  });

  const { data: coinsData, isLoading: loadingCoins } = useQuery({
    queryKey: ["topCoins"],
    queryFn: () => usersApi.getTopCoins(),
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["topOrders"],
    queryFn: () => usersApi.getTopOrders(),
  });

  const getUsersForTab = () => {
    switch (activeTab) {
      case "turns":
        return turnsData?.data?.data || [];
      case "coins":
        return coinsData?.data?.data || [];
      case "orders":
        return ordersData?.data?.data || [];
      default:
        return [];
    }
  };

  const isLoading =
    (activeTab === "turns" && loadingTurns) ||
    (activeTab === "coins" && loadingCoins) ||
    (activeTab === "orders" && loadingOrders);

  const currentUsers = getUsersForTab();

  const renderValue = (user: any) => {
    switch (activeTab) {
      case "turns":
        return (
          <>
            <strong className="text-orange-600">{user.totalTurns} lượt</strong>
            <span className="text-gray-400 text-[10px] sm:text-xs ml-1 block sm:inline">
              từ {user.packageCount} gói
            </span>
          </>
        );
      case "coins":
        return (
          <strong className="text-yellow-600">
            {formatVND(user.gameCoins || 0).replace(" ₫", "")} xu
          </strong>
        );
      case "orders":
        return (
          <strong className="text-emerald-600">{user.orderCount} đơn</strong>
        );
      default:
        return null;
    }
  };

  const getThemeClasses = (tab: TabType) => {
    switch (tab) {
      case "turns":
        return {
          titleGradient: "from-orange-500 to-red-500",
          spinner: "border-orange-200 border-t-orange-500",
          top1RankBg: "text-orange-500 bg-orange-100 border-orange-200",
          top1Gradient:
            "from-orange-50 via-white to-red-50 border-orange-200 shadow-orange-100/50",
          top1Badge: "from-orange-400 to-red-600 shadow-orange-500/30",
          fillIcon: "fill-orange-500",
          hoverGroup: "group-hover:bg-orange-50 group-hover:text-orange-500",
        };
      case "coins":
        return {
          titleGradient: "from-yellow-500 to-orange-500",
          spinner: "border-yellow-200 border-t-yellow-500",
          top1RankBg: "text-yellow-500 bg-yellow-100 border-yellow-200",
          top1Gradient:
            "from-yellow-50 via-white to-amber-50 border-yellow-200 shadow-yellow-100/50",
          top1Badge: "from-yellow-400 to-orange-600 shadow-yellow-500/30",
          fillIcon: "fill-yellow-500",
          hoverGroup: "group-hover:bg-yellow-50 group-hover:text-yellow-500",
        };
      case "orders":
        return {
          titleGradient: "from-emerald-500 to-teal-500",
          spinner: "border-emerald-200 border-t-emerald-500",
          top1RankBg: "text-emerald-500 bg-emerald-100 border-emerald-200",
          top1Gradient:
            "from-emerald-50 via-white to-green-50 border-emerald-200 shadow-emerald-100/50",
          top1Badge: "from-emerald-400 to-teal-600 shadow-emerald-500/30",
          fillIcon: "fill-emerald-500",
          hoverGroup: "group-hover:bg-emerald-50 group-hover:text-emerald-500",
        };
    }
  };

  const themeClass = getThemeClasses(activeTab);

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="text-center mt-8 mb-10">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
          Bảng Xếp Hạng{" "}
          <span
            className={`text-transparent bg-clip-text bg-gradient-to-r ${themeClass.titleGradient}`}
          >
            Danh Dự
          </span>
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base">
          Nơi tôn vinh những khách hàng VIP nhất hệ thống. Liệu bạn có thể ghi
          tên mình lên Bảng Vàng?
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-gray-100 p-1.5 rounded-full">
          <button
            onClick={() => setActiveTab("turns")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "turns"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Crown size={18} />
            Top Đại Gia
          </button>
          <button
            onClick={() => setActiveTab("coins")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "coins"
                ? "bg-white text-yellow-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Coins size={18} />
            Tỷ Phú Xu
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "orders"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShoppingBag size={18} />
            Top Đặt Cơm
          </button>
        </div>
      </div>

      {/* Leaderboard Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div
            className={`w-8 h-8 border-4 rounded-full animate-spin ${themeClass.spinner}`}
          ></div>
        </div>
      ) : currentUsers.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          Chưa có dữ liệu bảng xếp hạng này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {currentUsers.map((user: any, index: number) => {
            const isTop3 = index < 3;
            let RankIcon = null;
            let rankColors = "";
            let bgGradient = "";

            if (index === 0) {
              RankIcon = Trophy;
              rankColors = themeClass.top1RankBg;
              bgGradient = `bg-gradient-to-br ${themeClass.top1Gradient}`;
            } else if (index === 1) {
              RankIcon = Medal;
              rankColors = "text-gray-400 bg-gray-100 border-gray-200";
              bgGradient =
                "bg-gradient-to-br from-gray-50 via-white to-gray-100 border-gray-200 shadow-gray-200/50";
            } else if (index === 2) {
              RankIcon = Medal;
              rankColors = "text-amber-600 bg-amber-100 border-amber-200";
              bgGradient =
                "bg-gradient-to-br from-orange-50 via-white to-orange-100 border-orange-200 shadow-orange-100/50";
            } else {
              // Others (4-10)
              return (
                <div
                  key={user._id || user.name}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group md:col-span-2 lg:col-span-1"
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 font-bold text-sm border border-gray-100 transition-colors ${themeClass.hoverGroup}`}
                  >
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">
                      {user.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {renderValue(user)}
                    </p>
                  </div>
                </div>
              );
            }

            // Top 3 Layout
            return (
              <div
                key={user._id || user.name}
                className={`relative p-6 rounded-3xl border-2 transition-all hover:-translate-y-2 hover:shadow-xl ${bgGradient} ${isTop3 ? "lg:col-span-1 md:col-span-2" : ""}`}
              >
                {index === 0 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span
                      className={`px-4 py-1.5 bg-gradient-to-r ${themeClass.top1Badge} text-white text-xs font-black rounded-full uppercase tracking-widest shadow-lg border-2 border-white inline-block`}
                    >
                      👑 QUÁN QUÂN 👑
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-center mt-2">
                  <div
                    className={`w-20 h-20 flex items-center justify-center rounded-full border-4 shadow-inner mb-4 bg-white ${rankColors}`}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <RankIcon
                        size={36}
                        className={index === 0 ? themeClass.fillIcon : ""}
                      />
                    )}
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-1 text-center truncate w-full px-4">
                    {user.name}
                  </h3>
                  <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-white/60 rounded-full border border-gray-200/50 backdrop-blur-sm">
                    <p className="text-sm font-medium text-gray-600">
                      {renderValue(user)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
