import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersApi, authApi } from "@/services/api";
import { Trophy, Medal, ShoppingBag, Crown } from "lucide-react";
import { formatVND, cn } from "@/lib/utils";
import { VipMascotInline } from "@/components/VipMascots";

type TabType = "turns" | "orders";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("turns");

  const { data: turnsData, isLoading: loadingTurns } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => usersApi.getLeaderboard(),
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["topOrders"],
    queryFn: () => usersApi.getTopOrders(),
  });

  const { data: profileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => authApi.getMe(),
  });

  const user = profileData?.data.data;
  const isVip = user?.hasMembership || false;
  const vipTheme = user?.vipCosmetics?.vipTheme || "default";

  const getUsersForTab = () => {
    switch (activeTab) {
      case "turns":
        return turnsData?.data?.data || [];
      case "orders":
        return ordersData?.data?.data || [];
      default:
        return [];
    }
  };

  const isLoading =
    (activeTab === "turns" && loadingTurns) ||
    (activeTab === "orders" && loadingOrders);

  const currentUsers = getUsersForTab();

  const renderValueText = (user: any) => {
    switch (activeTab) {
      case "turns":
        return formatVND(user.totalTurns || 0);
      case "orders":
        return `${user.orderCount} đơn`;
      default:
        return "";
    }
  };

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case "gold":
        return {
          titleGradient: "from-amber-500 via-yellow-500 to-amber-600",
          spinner: "border-amber-200 border-t-amber-500",
          top1RankBg: "text-amber-500 bg-amber-100 border-amber-200",
          top1Gradient:
            "from-amber-50 via-white to-yellow-50 border-amber-200 shadow-amber-100/50",
          top1Badge: "from-amber-400 to-yellow-600 shadow-amber-500/30",
          fillIcon: "fill-amber-500",
          hoverGroup: "group-hover:bg-amber-50 group-hover:text-amber-500",
          textActive: "text-amber-600",
          badgeBg: "bg-amber-50/50 border-amber-100 text-amber-600",
          top3Bg: "bg-gradient-to-br from-yellow-50 via-white to-amber-100 border-yellow-200 shadow-yellow-100/50",
          top3Rank: "text-amber-600 bg-amber-100 border-amber-200",
        };
      case "dark":
        return {
          titleGradient: "from-cyan-400 to-indigo-500",
          spinner: "border-slate-800 border-t-cyan-500",
          top1RankBg: "text-cyan-400 bg-slate-800 border-slate-700",
          top1Gradient:
            "from-slate-900 via-slate-950 to-slate-900 border-violet-800 shadow-violet-950/50",
          top1Badge: "from-violet-500 to-indigo-600 shadow-violet-500/30",
          fillIcon: "fill-cyan-400",
          hoverGroup: "group-hover:bg-slate-800 group-hover:text-cyan-400",
          textActive: "text-cyan-400",
          badgeBg: "bg-slate-800 border-slate-700 text-cyan-400",
          top3Bg: "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-indigo-900 shadow-indigo-950/50",
          top3Rank: "text-indigo-400 bg-slate-800 border-slate-700",
        };
      case "sakura":
        return {
          titleGradient: "from-pink-500 via-rose-500 to-pink-600",
          spinner: "border-pink-200 border-t-pink-500",
          top1RankBg: "text-pink-500 bg-pink-100 border-pink-200",
          top1Gradient:
            "from-pink-50 via-white to-rose-50 border-pink-200 shadow-pink-100/50",
          top1Badge: "from-pink-400 to-rose-600 shadow-pink-500/30",
          fillIcon: "fill-pink-500",
          hoverGroup: "group-hover:bg-pink-50 group-hover:text-pink-550",
          textActive: "text-pink-600",
          badgeBg: "bg-pink-50 border-pink-100 text-pink-600",
          top3Bg: "bg-gradient-to-br from-rose-50 via-white to-pink-100 border-rose-200 shadow-rose-100/50",
          top3Rank: "text-pink-600 bg-pink-100 border-pink-200",
        };
      case "emerald":
        return {
          titleGradient: "from-emerald-500 to-green-600",
          spinner: "border-emerald-200 border-t-emerald-500",
          top1RankBg: "text-emerald-600 bg-emerald-100 border-emerald-200",
          top1Gradient:
            "from-emerald-50 via-white to-green-50 border-emerald-200 shadow-emerald-100/50",
          top1Badge: "from-emerald-400 to-green-600 shadow-emerald-500/30",
          fillIcon: "fill-emerald-500",
          hoverGroup: "group-hover:bg-emerald-50 group-hover:text-emerald-500",
          textActive: "text-emerald-600",
          badgeBg: "bg-emerald-50/50 border-emerald-100 text-emerald-600",
          top3Bg: "bg-gradient-to-br from-green-50 via-white to-emerald-100 border-green-200 shadow-green-100/50",
          top3Rank: "text-emerald-700 bg-emerald-100 border-emerald-200",
        };
      case "ocean":
        return {
          titleGradient: "from-sky-500 to-blue-600",
          spinner: "border-sky-200 border-t-sky-500",
          top1RankBg: "text-sky-600 bg-sky-100 border-sky-200",
          top1Gradient:
            "from-sky-50 via-white to-blue-50 border-sky-200 shadow-sky-100/50",
          top1Badge: "from-sky-400 to-blue-600 shadow-sky-500/30",
          fillIcon: "fill-sky-500",
          hoverGroup: "group-hover:bg-sky-50 group-hover:text-sky-500",
          textActive: "text-sky-600",
          badgeBg: "bg-sky-50 border-sky-100 text-sky-600",
          top3Bg: "bg-gradient-to-br from-blue-50 via-white to-sky-100 border-blue-200 shadow-blue-100/50",
          top3Rank: "text-sky-700 bg-sky-100 border-sky-200",
        };
      case "lava":
        return {
          titleGradient: "from-red-500 to-rose-600",
          spinner: "border-red-200 border-t-red-500",
          top1RankBg: "text-red-600 bg-red-100 border-red-200",
          top1Gradient:
            "from-red-50 via-white to-rose-50 border-red-200 shadow-red-100/50",
          top1Badge: "from-red-400 to-rose-600 shadow-red-500/30",
          fillIcon: "fill-red-500",
          hoverGroup: "group-hover:bg-red-50 group-hover:text-red-500",
          textActive: "text-red-600",
          badgeBg: "bg-red-50 border-red-100 text-red-600",
          top3Bg: "bg-gradient-to-br from-rose-50 via-white to-red-100 border-rose-200 shadow-rose-100/50",
          top3Rank: "text-red-700 bg-red-100 border-red-200",
        };
      case "sunset":
        return {
          titleGradient: "from-orange-400 via-pink-500 to-rose-500",
          spinner: "border-rose-200 border-t-rose-500",
          top1RankBg: "text-orange-500 bg-orange-100 border-orange-200",
          top1Gradient:
            "from-orange-50 via-white to-rose-50 border-orange-200 shadow-orange-100/50",
          top1Badge: "from-orange-400 via-pink-500 to-rose-550 shadow-orange-500/30",
          fillIcon: "fill-rose-500",
          hoverGroup: "group-hover:bg-rose-50 group-hover:text-rose-500",
          textActive: "text-rose-600",
          badgeBg: "bg-rose-50 border-rose-100 text-rose-600",
          top3Bg: "bg-gradient-to-br from-rose-50 via-white to-orange-100 border-rose-200 shadow-rose-100/50",
          top3Rank: "text-rose-700 bg-rose-100 border-rose-200",
        };
      case "cotton-candy":
        return {
          titleGradient: "from-purple-400 via-pink-400 to-sky-500",
          spinner: "border-purple-200 border-t-purple-500",
          top1RankBg: "text-purple-500 bg-purple-100 border-purple-200",
          top1Gradient:
            "from-purple-50 via-white to-pink-50 border-purple-200 shadow-purple-100/50",
          top1Badge: "from-purple-400 via-pink-400 to-sky-500 shadow-purple-500/30",
          fillIcon: "fill-purple-500",
          hoverGroup: "group-hover:bg-purple-50 group-hover:text-purple-500",
          textActive: "text-purple-600",
          badgeBg: "bg-purple-50 border-purple-100 text-purple-600",
          top3Bg: "bg-gradient-to-br from-pink-50 via-white to-purple-100 border-pink-200 shadow-pink-100/50",
          top3Rank: "text-purple-700 bg-purple-100 border-purple-200",
        };
      case "cyberpunk":
        return {
          titleGradient: "from-pink-500 via-purple-500 to-cyan-500",
          spinner: "border-zinc-800 border-t-pink-500",
          top1RankBg: "text-pink-400 bg-zinc-800 border-zinc-700",
          top1Gradient:
            "from-zinc-900 via-zinc-950 to-zinc-900 border-pink-500 shadow-pink-950/50",
          top1Badge: "from-pink-500 via-purple-600 to-cyan-500 shadow-pink-500/30",
          fillIcon: "fill-pink-500",
          hoverGroup: "group-hover:bg-zinc-800 group-hover:text-pink-400",
          textActive: "text-pink-400",
          badgeBg: "bg-zinc-800 border-zinc-700 text-cyan-400",
          top3Bg: "bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border-cyan-500 shadow-cyan-950/50",
          top3Rank: "text-cyan-400 bg-zinc-800 border-zinc-700",
        };
      case "default":
      default:
        return {
          titleGradient: "from-orange-500 to-red-500",
          spinner: "border-orange-200 border-t-orange-500",
          top1RankBg: "text-orange-500 bg-orange-100 border-orange-200",
          top1Gradient:
            "from-orange-50 via-white to-red-50 border-orange-200 shadow-orange-100/50",
          top1Badge: "from-orange-400 to-red-600 shadow-orange-500/30",
          fillIcon: "fill-orange-500",
          hoverGroup: "group-hover:bg-orange-50 group-hover:text-orange-500",
          textActive: "text-orange-600",
          badgeBg: "bg-orange-50/50 border-orange-100 text-orange-600",
          top3Bg: "bg-gradient-to-br from-orange-50 via-white to-orange-100 border-orange-200 shadow-orange-100/50",
          top3Rank: "text-amber-600 bg-amber-100 border-amber-200",
        };
    }
  };

  const activeTheme = isVip && vipTheme !== "default" ? vipTheme : (activeTab === "turns" ? "default" : "emerald");
  const themeClass = getThemeClasses(activeTheme);

  return (
    <div className={cn("max-w-4xl mx-auto pb-20 px-4 transition-all duration-300", isVip && vipTheme !== "default" && `theme-${vipTheme}`)}>
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
                ? `bg-white ${themeClass.textActive} shadow-sm`
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Crown size={18} />
            Top Đại Gia
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "orders"
                ? `bg-white ${themeClass.textActive} shadow-sm`
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
              rankColors = themeClass.top3Rank;
              bgGradient = themeClass.top3Bg;
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
                    <p className="text-xs mt-0.5">
                      <strong className={`font-bold ${themeClass.textActive}`}>
                        {renderValueText(user)}
                      </strong>
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
                  <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-sm ${themeClass.badgeBg}`}>
                    <strong className="text-sm font-black">
                      {renderValueText(user)}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Mascot Inline Advisor */}
      <VipMascotInline className="max-w-2xl mx-auto mt-8" />
    </div>
  );
}
