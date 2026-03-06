import { useState, useEffect, useCallback } from "react";
import { Lock, Sparkles, Coins, ShoppingCart } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { gameCoinsApi } from "@/services/api";
import BauCuaGame from "@/pages/BauCuaGame";
import XiDachGame from "@/pages/XiDachGame";

const ACCESS_CODE = "MINHLAOMA";

type GameId = "menu" | "baucua" | "xidach";

interface GameOption {
  id: GameId;
  title: string;
  emoji: string;
  desc: string;
  gradient: string;
  shadow: string;
}

const GAMES: GameOption[] = [
  {
    id: "baucua",
    title: "Bầu Cua Tôm Cá",
    emoji: "🎲",
    desc: "Trò chơi dân gian truyền thống",
    gradient: "from-amber-400 via-orange-400 to-red-400",
    shadow: "shadow-orange-200",
  },
  {
    id: "xidach",
    title: "Xì Dách",
    emoji: "🃏",
    desc: "Blackjack phiên bản Việt Nam",
    gradient: "from-violet-500 via-purple-500 to-indigo-500",
    shadow: "shadow-purple-200",
  },
];

// ============ CODE GATE ============
function CodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      sessionStorage.setItem("entertainment_access", "true");
      onUnlock();
    } else {
      setError("Sai mã rồi đạo hữu ơi! 😅");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className={`max-w-sm w-full ${shake ? "animate-shake" : ""}`}>
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-purple-300 mb-5 rotate-3 hover:rotate-0 transition-transform duration-300">
              <Lock className="text-white" size={40} />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm shadow-lg animate-bounce">
              🔒
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Khu Giải Trí
          </h1>
          <p className="text-gray-400 text-sm">
            Vùng đất bí ẩn đang chờ bạn khám phá...
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-8"
        >
          <label className="block text-sm font-bold text-gray-600 mb-3">
            🔑 Mã truy cập
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            placeholder="Nhập mã bí mật..."
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-center text-xl font-black tracking-[0.3em] uppercase bg-gray-50 focus:bg-white"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm font-semibold text-center mt-3">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full mt-5 py-4 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-purple-200 hover:shadow-2xl hover:shadow-purple-300 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Mở khóa 🚀
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">
          💡 Hỏi admin để lấy mã bí mật nhé!
        </p>
      </div>
    </div>
  );
}

// ============ GAME MENU ============
function GameMenu({
  onSelect,
  balance,
  onGoToShop,
}: {
  onSelect: (id: GameId) => void;
  balance: number;
  onGoToShop: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto pb-10">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-purple-200 mb-2">
          <Sparkles size={14} />
          Khu Giải Trí
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-1">🎮 Chọn Game</h1>
        <p className="text-gray-400 text-sm">Chọn trò chơi bạn muốn chơi</p>
      </div>

      {/* Balance */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-2xl p-3.5 mb-6 shadow-lg shadow-orange-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Coins className="text-white" size={20} />
            </div>
            <div>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                Xu của bạn
              </p>
              <p className="text-white text-xl font-black leading-tight">
                {balance.toLocaleString()} xu
              </p>
            </div>
          </div>
          <button
            onClick={onGoToShop}
            className="flex items-center gap-1.5 bg-white/25 hover:bg-white/35 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all backdrop-blur-sm"
          >
            <ShoppingCart size={13} />
            Đổi lượt cơm
          </button>
        </div>
      </div>

      {/* Game Cards */}
      <div className="grid grid-cols-1 gap-4">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelect(game.id)}
            disabled={balance <= 0}
            className={`group relative overflow-hidden rounded-3xl border-2 border-gray-100 bg-white shadow-md transition-all text-left ${
              balance > 0
                ? "hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            <div className={`h-2 bg-gradient-to-r ${game.gradient}`} />
            <div className="p-5 flex items-center gap-4">
              <div
                className={`w-16 h-16 bg-gradient-to-br ${game.gradient} rounded-2xl flex items-center justify-center text-3xl shadow-lg ${game.shadow} group-hover:scale-110 transition-transform`}
              >
                {game.emoji}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                  {game.title}
                </h3>
                <p className="text-sm text-gray-400">{game.desc}</p>
              </div>
              <div className="text-gray-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all text-xl">
                →
              </div>
            </div>
          </button>
        ))}

        {/* Shop card (Redirect version) */}
        <button
          onClick={onGoToShop}
          className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 shadow-sm hover:shadow-md transition-all text-left hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="p-5 flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
              🏪
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors">
                Đổi Xu → Lượt Cơm
              </h3>
              <p className="text-sm text-gray-400">
                100,000 xu = 1 lượt cơm miễn phí!
              </p>
            </div>
            <div className="text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all text-xl">
              →
            </div>
          </div>
        </button>
      </div>

      {balance <= 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
          <p className="text-amber-600 text-sm font-bold">
            ⚠️ Bạn chưa có xu! Hãy mua gói đặt cơm để nhận xu bonus.
          </p>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-6">
        🎰 Mua gói cơm = nhận xu bonus (1 lượt = 1,000 xu) • Chơi game tích xu!
        🎉
      </p>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function EntertainmentPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("entertainment_access") === "true",
  );
  const [currentGame, setCurrentGame] = useState<GameId>("menu");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch balance from server
  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await gameCoinsApi.getBalance();
      setBalance(res.data.data?.gameCoins || 0);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchBalance]);

  // Sync coins with server after game ends
  const syncCoins = useCallback(
    async (delta: number) => {
      if (!isAuthenticated || delta === 0) return;
      try {
        const res = await gameCoinsApi.updateCoins(delta);
        setBalance(res.data.data?.gameCoins || 0);
      } catch {
        // fallback: refetch
        fetchBalance();
      }
    },
    [isAuthenticated, fetchBalance],
  );

  const setBalanceFn = useCallback((fn: (prev: number) => number) => {
    setBalance(fn);
  }, []);

  // Sync when returning to menu
  const handleBackToMenu = useCallback(async () => {
    // Sync with server
    await fetchBalance();
    setCurrentGame("menu");
  }, [fetchBalance]);

  const handleGoToShop = () => {
    navigate("/packages?tab=coin-exchange");
  };

  // Redirect if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Cần đăng nhập
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Đăng nhập để chơi game và tích xu nhé!
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-purple-200 hover:-translate-y-0.5 transition-all"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (!unlocked) return <CodeGate onUnlock={() => setUnlocked(true)} />;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-3">🎮</div>
          <p className="text-gray-400 font-bold">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (currentGame === "baucua") {
    return (
      <BauCuaGame
        balance={balance}
        setBalance={setBalanceFn}
        onBack={handleBackToMenu}
        onGameEnd={syncCoins}
      />
    );
  }

  if (currentGame === "xidach") {
    return (
      <XiDachGame
        balance={balance}
        setBalance={setBalanceFn}
        onBack={handleBackToMenu}
        onGameEnd={syncCoins}
      />
    );
  }

  return (
    <GameMenu
      onSelect={setCurrentGame}
      balance={balance}
      onGoToShop={handleGoToShop}
    />
  );
}
