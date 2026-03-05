import { useState, useEffect } from "react";
import { Lock, Sparkles, RotateCcw, Coins } from "lucide-react";
import BauCuaGame from "@/pages/BauCuaGame";
import XiDachGame from "@/pages/XiDachGame";

const ACCESS_CODE = "MINHLAOMA";
const STORAGE_KEYS = { balance: "baucua_balance", access: "baucua_access" };

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
      sessionStorage.setItem(STORAGE_KEYS.access, "true");
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
            <p className="text-red-500 text-sm font-semibold text-center mt-3 animate-fade-in">
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
  onResetBalance,
}: {
  onSelect: (id: GameId) => void;
  balance: number;
  onResetBalance: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto pb-10">
      {/* Header */}
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
                Số dư chung
              </p>
              <p className="text-white text-xl font-black leading-tight">
                {balance.toLocaleString()} xu
              </p>
            </div>
          </div>
          {balance === 0 && (
            <button
              onClick={onResetBalance}
              className="flex items-center gap-1.5 bg-white/25 hover:bg-white/35 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all backdrop-blur-sm"
            >
              <RotateCcw size={13} />
              Nạp 1000 xu
            </button>
          )}
        </div>
      </div>

      {/* Game Cards */}
      <div className="grid grid-cols-1 gap-4">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelect(game.id)}
            className="group relative overflow-hidden rounded-3xl border-2 border-gray-100 bg-white shadow-md hover:shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 text-left"
          >
            {/* Gradient top bar */}
            <div className={`h-2 bg-gradient-to-r ${game.gradient}`} />

            <div className="p-5 flex items-center gap-4">
              {/* Icon */}
              <div
                className={`w-16 h-16 bg-gradient-to-br ${game.gradient} rounded-2xl flex items-center justify-center text-3xl shadow-lg ${game.shadow} group-hover:scale-110 transition-transform`}
              >
                {game.emoji}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                  {game.title}
                </h3>
                <p className="text-sm text-gray-400">{game.desc}</p>
              </div>

              {/* Arrow */}
              <div className="text-gray-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all text-xl">
                →
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Fun note */}
      <p className="text-center text-xs text-gray-400 mt-6">
        🎰 Xu ảo dùng chung giữa các game • Chơi vui là chính! 😄
      </p>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function EntertainmentPage() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(STORAGE_KEYS.access) === "true",
  );
  const [currentGame, setCurrentGame] = useState<GameId>("menu");
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.balance);
    return saved ? parseInt(saved) : 1000;
  });

  // Persist balance
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.balance, balance.toString());
  }, [balance]);

  const resetBalance = () => setBalance(1000);
  const setBalanceFn = (fn: (prev: number) => number) => setBalance(fn);

  if (!unlocked) return <CodeGate onUnlock={() => setUnlocked(true)} />;

  if (currentGame === "baucua") {
    return (
      <BauCuaGame
        balance={balance}
        setBalance={setBalanceFn}
        onBack={() => setCurrentGame("menu")}
      />
    );
  }

  if (currentGame === "xidach") {
    return (
      <XiDachGame
        balance={balance}
        setBalance={setBalanceFn}
        onBack={() => setCurrentGame("menu")}
      />
    );
  }

  return (
    <GameMenu
      onSelect={setCurrentGame}
      balance={balance}
      onResetBalance={resetBalance}
    />
  );
}
