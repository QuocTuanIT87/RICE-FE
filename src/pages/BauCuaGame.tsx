import { useState, useCallback } from "react";
import {
  Dices,
  RotateCcw,
  Trophy,
  Coins,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";

// ============ TYPES ============
type SymbolId = "nai" | "bau" | "ga" | "ca" | "cua" | "tom";

interface SymbolInfo {
  id: SymbolId;
  emoji: string;
  label: string;
  gradient: string;
  shadow: string;
  ring: string;
}

// ============ CONSTANTS ============
const SYMBOLS: SymbolInfo[] = [
  {
    id: "nai",
    emoji: "🦌",
    label: "Nai",
    gradient: "from-amber-400 to-yellow-500",
    shadow: "shadow-amber-200",
    ring: "ring-amber-400",
  },
  {
    id: "bau",
    emoji: "🫒",
    label: "Bầu",
    gradient: "from-emerald-400 to-green-500",
    shadow: "shadow-emerald-200",
    ring: "ring-emerald-400",
  },
  {
    id: "ga",
    emoji: "🐓",
    label: "Gà",
    gradient: "from-rose-400 to-red-500",
    shadow: "shadow-rose-200",
    ring: "ring-rose-400",
  },
  {
    id: "ca",
    emoji: "🐟",
    label: "Cá",
    gradient: "from-sky-400 to-blue-500",
    shadow: "shadow-sky-200",
    ring: "ring-sky-400",
  },
  {
    id: "cua",
    emoji: "🦀",
    label: "Cua",
    gradient: "from-orange-400 to-orange-500",
    shadow: "shadow-orange-200",
    ring: "ring-orange-400",
  },
  {
    id: "tom",
    emoji: "🦐",
    label: "Tôm",
    gradient: "from-pink-400 to-fuchsia-500",
    shadow: "shadow-pink-200",
    ring: "ring-pink-400",
  },
];

const BET_CHIPS = [10, 20, 50, 100];

// ============ PROPS ============
interface BauCuaGameProps {
  balance: number;
  setBalance: (fn: (prev: number) => number) => void;
  onBack: () => void;
}

// ============ MAIN GAME ============
export default function BauCuaGame({
  balance,
  setBalance,
  onBack,
}: BauCuaGameProps) {
  const [bets, setBets] = useState<Record<SymbolId, number>>({
    nai: 0,
    bau: 0,
    ga: 0,
    ca: 0,
    cua: 0,
    tom: 0,
  });
  const [selectedChip, setSelectedChip] = useState(10);
  const [diceResults, setDiceResults] = useState<SymbolId[]>([
    "nai",
    "bau",
    "ga",
  ]);
  const [rolling, setRolling] = useState(false);
  const [gameResult, setGameResult] = useState<{
    won: number;
    lost: number;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<
    Array<{ dice: SymbolId[]; won: number; lost: number }>
  >([]);

  const totalBet = Object.values(bets).reduce((sum, b) => sum + b, 0);

  const addBet = useCallback(
    (id: SymbolId, amount?: number) => {
      const betAmt = amount || selectedChip;
      if (rolling || balance < betAmt) return;
      setBets((prev) => ({ ...prev, [id]: prev[id] + betAmt }));
      setBalance((prev) => prev - betAmt);
      setGameResult(null);
      setShowResult(false);
    },
    [rolling, balance, selectedChip, setBalance],
  );

  const removeBet = useCallback(
    (id: SymbolId) => {
      if (rolling) return;
      const cur = bets[id];
      if (cur <= 0) return;
      const amt = Math.min(selectedChip, cur);
      setBets((prev) => ({ ...prev, [id]: prev[id] - amt }));
      setBalance((prev) => prev + amt);
    },
    [rolling, bets, selectedChip, setBalance],
  );

  const clearBets = useCallback(() => {
    if (rolling) return;
    setBalance((prev) => prev + totalBet);
    setBets({ nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 });
    setGameResult(null);
    setShowResult(false);
  }, [rolling, totalBet, setBalance]);

  const rollDice = useCallback(() => {
    if (rolling || totalBet === 0) return;
    setRolling(true);
    setGameResult(null);
    setShowResult(false);

    const finalResults: SymbolId[] = Array.from(
      { length: 3 },
      () => SYMBOLS[Math.floor(Math.random() * 6)].id,
    );

    const interval = setInterval(() => {
      setDiceResults(
        Array.from(
          { length: 3 },
          () => SYMBOLS[Math.floor(Math.random() * 6)].id,
        ),
      );
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      setDiceResults(finalResults);
      setRolling(false);

      let totalWon = 0;
      let totalLost = 0;
      for (const sym of SYMBOLS) {
        const bet = bets[sym.id];
        if (bet <= 0) continue;
        const count = finalResults.filter((r) => r === sym.id).length;
        if (count > 0) {
          totalWon += bet + bet * count;
        } else {
          totalLost += bet;
        }
      }

      setBalance((prev) => prev + totalWon);
      setGameResult({ won: totalWon, lost: totalLost });
      setShowResult(true);
      setHistory((prev) => [
        { dice: finalResults, won: totalWon, lost: totalLost },
        ...prev.slice(0, 14),
      ]);
      setBets({ nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 });
    }, 1800);
  }, [rolling, totalBet, bets, setBalance]);

  return (
    <div className="max-w-lg mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <h1 className="text-2xl font-black text-gray-900">🎲 Bầu Cua Tôm Cá</h1>
        <div className="w-20" />
      </div>

      {/* Balance */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-2xl p-3.5 mb-5 shadow-lg shadow-orange-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Coins className="text-white" size={20} />
            </div>
            <div>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                Số dư
              </p>
              <p className="text-white text-xl font-black leading-tight">
                {balance.toLocaleString()} xu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalBet > 0 && (
              <div className="bg-white/20 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                <p className="text-white/70 text-[10px] font-bold">Đang cược</p>
                <p className="text-white text-sm font-black text-right">
                  {totalBet} xu
                </p>
              </div>
            )}
            {balance === 0 && totalBet === 0 && (
              <button
                onClick={() => setBalance(() => 1000)}
                className="flex items-center gap-1.5 bg-white/25 hover:bg-white/35 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all backdrop-blur-sm"
              >
                <RotateCcw size={13} />
                Nạp 1000 xu
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dice Zone */}
      <div className="relative bg-gradient-to-b from-green-700 via-emerald-800 to-green-900 rounded-3xl p-5 mb-5 shadow-2xl border-2 border-green-600/50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-3 left-3 text-6xl">🎲</div>
          <div className="absolute bottom-3 right-3 text-6xl">🎲</div>
        </div>

        {/* Dice */}
        <div className="relative flex items-center justify-center gap-3 sm:gap-5 py-4">
          {diceResults.map((result, i) => {
            const sym = SYMBOLS.find((s) => s.id === result)!;
            return (
              <div
                key={i}
                className={`w-[5.5rem] h-[5.5rem] sm:w-28 sm:h-28 bg-white rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center shadow-xl border-2 border-white/80 ${
                  rolling ? "animate-dice-roll" : "animate-bounce-in"
                }`}
                style={{
                  animationDelay: rolling ? `${i * 0.08}s` : `${i * 0.12}s`,
                }}
              >
                <span className="text-4xl sm:text-5xl leading-none">
                  {sym.emoji}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1">
                  {sym.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Result */}
        {showResult && gameResult && !rolling && (
          <div
            className={`relative text-center py-3 px-4 rounded-2xl mt-1 animate-bounce-in ${
              gameResult.won > 0
                ? "bg-gradient-to-r from-yellow-400/30 to-amber-400/30 border border-yellow-300/40"
                : "bg-gradient-to-r from-red-400/20 to-rose-400/20 border border-red-300/30"
            }`}
          >
            {gameResult.won > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <Trophy size={20} className="text-yellow-300" />
                <span className="text-yellow-200 font-black text-xl">
                  +{gameResult.won} xu!
                </span>
                <span className="text-lg">🎉</span>
              </div>
            ) : (
              <span className="text-red-300 font-bold">
                Thua {gameResult.lost} xu 😢 Cố lên!
              </span>
            )}
          </div>
        )}

        {/* Roll Button */}
        <div className="relative text-center mt-4">
          <button
            onClick={rollDice}
            disabled={rolling || totalBet === 0}
            className={`relative inline-flex items-center gap-3 px-10 py-3.5 rounded-2xl text-lg font-black transition-all ${
              rolling || totalBet === 0
                ? "bg-gray-500/50 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 text-white shadow-xl shadow-amber-400/40 hover:shadow-2xl hover:shadow-amber-400/50 hover:-translate-y-1 active:translate-y-0 active:shadow-lg"
            }`}
          >
            <Dices size={24} className={rolling ? "animate-spin" : ""} />
            {rolling
              ? "Đang lắc..."
              : totalBet === 0
                ? "Đặt cược trước"
                : "LẮC! 🎲"}
          </button>
        </div>
      </div>

      {/* Chip Selector */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold text-gray-500">
          💰 Chọn mệnh giá:
        </span>
        {totalBet > 0 && (
          <button
            onClick={clearBets}
            disabled={rolling}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 font-bold transition-colors"
          >
            <Trash2 size={12} />
            Hủy cược
          </button>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2 mb-5">
        {BET_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setSelectedChip(chip)}
            className={`relative py-2.5 rounded-xl text-sm font-black transition-all ${
              selectedChip === chip
                ? "bg-gradient-to-b from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-200 scale-105 ring-2 ring-orange-300 ring-offset-2"
                : "bg-white text-gray-600 border-2 border-gray-200 hover:border-orange-300 hover:text-orange-600"
            }`}
          >
            {chip} xu
          </button>
        ))}
        <button
          onClick={() => setSelectedChip(balance)}
          disabled={balance <= 0 || rolling}
          className={`relative py-2.5 rounded-xl text-sm font-black transition-all ${
            selectedChip === balance && balance > 0
              ? "bg-gradient-to-b from-red-500 to-rose-600 text-white shadow-lg shadow-red-200 scale-105 ring-2 ring-red-400 ring-offset-2"
              : balance <= 0 || rolling
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-white text-red-500 border-2 border-red-200 hover:border-red-400 hover:bg-red-50"
          }`}
        >
          ALL IN 🔥
        </button>
      </div>

      {/* Betting Board */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {SYMBOLS.map((sym) => {
          const bet = bets[sym.id];
          const matchCount =
            showResult && gameResult
              ? diceResults.filter((r) => r === sym.id).length
              : 0;
          const isWinner = matchCount > 0;

          return (
            <div
              key={sym.id}
              className={`relative rounded-2xl overflow-hidden transition-all duration-200 ${
                isWinner ? `ring-3 ${sym.ring} ring-offset-2 scale-[1.03]` : ""
              } ${bet > 0 ? "shadow-lg" : "shadow-sm hover:shadow-md"}`}
            >
              {isWinner && (
                <div className="absolute -top-1 -right-1 z-10 w-7 h-7 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-lg animate-bounce-in border-2 border-white">
                  x{matchCount}
                </div>
              )}

              <div
                className={`bg-gradient-to-br ${sym.gradient} p-[2px] rounded-2xl`}
              >
                <div className="bg-white rounded-[14px] p-3 text-center">
                  <div className="text-5xl mb-0.5 leading-none">
                    {sym.emoji}
                  </div>
                  <p className="text-xs font-bold text-gray-500 mb-2">
                    {sym.label}
                  </p>

                  {bet > 0 && (
                    <div
                      className={`bg-gradient-to-r ${sym.gradient} rounded-lg px-2 py-1 mb-2`}
                    >
                      <span className="text-white font-black text-sm">
                        {bet} xu
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBet(sym.id);
                      }}
                      disabled={rolling || bet <= 0}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        bet > 0
                          ? "bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-200"
                          : "bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      <Minus size={14} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => addBet(sym.id)}
                      disabled={rolling || balance < selectedChip}
                      className={`flex-[2] py-1.5 rounded-lg text-sm font-bold transition-all ${
                        !rolling && balance >= selectedChip
                          ? `bg-gradient-to-r ${sym.gradient} text-white shadow-md ${sym.shadow} hover:shadow-lg active:shadow-sm active:scale-95`
                          : "bg-gray-100 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      <Plus size={14} className="mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-4 mb-5 border border-gray-100">
        <p className="text-xs font-bold text-gray-400 mb-1.5">💡 Cách chơi</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">1️⃣</span>
            <span className="text-xs text-gray-500">
              Chọn mệnh giá xu bên trên
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">2️⃣</span>
            <span className="text-xs text-gray-500">
              Bấm <strong className="text-green-600">+</strong> để cược,{" "}
              <strong className="text-red-500">-</strong> để bỏ
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">3️⃣</span>
            <span className="text-xs text-gray-500">
              Bấm <strong className="text-orange-500">LẮC!</strong> rồi chờ kết
              quả
            </span>
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-600">📜 Lịch sử</p>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
              {history.length} ván
            </span>
          </div>
          <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-mono w-5">
                    #{history.length - i}
                  </span>
                  {h.dice.map((r, j) => (
                    <span key={j} className="text-xl leading-none">
                      {SYMBOLS.find((s) => s.id === r)!.emoji}
                    </span>
                  ))}
                </div>
                <span
                  className={`text-sm font-black ${h.won > 0 ? "text-green-500" : "text-red-400"}`}
                >
                  {h.won > 0 ? `+${h.won}` : `-${h.lost}`} xu
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
