import { useState, useCallback, useRef, useEffect } from "react";
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  Trash2,
  Coins,
  Dices,
  Trophy,
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

const BET_CHIPS = [1000, 2000, 5000, 10000, 20000, 50000, 1000000];

// ============ PROPS ============
interface BauCuaGameProps {
  balance: number;
  setBalance: (fn: (prev: number) => number) => void;
  onBack: () => void;
  onGameEnd?: (delta: number) => void;
}

// ============ MAIN GAME ============
export default function BauCuaGame({
  balance,
  setBalance,
  onBack,
  onGameEnd,
}: BauCuaGameProps) {
  const [bets, setBets] = useState<Record<SymbolId, number>>({
    nai: 0,
    bau: 0,
    ga: 0,
    ca: 0,
    cua: 0,
    tom: 0,
  });
  const [selectedChip, setSelectedChip] = useState(1000);
  const [diceResults, setDiceResults] = useState<SymbolId[]>([
    "bau",
    "bau",
    "bau",
  ]);
  // gameResult is kept for future result animations/summaries if needed
  // Removing if purely unused
  // const [gameResult, setGameResult] = useState<{ won: number; lost: number } | null>(null);
  const [history, setHistory] = useState<
    Array<{ dice: SymbolId[]; won: number; lost: number }>
  >([]);
  const [gameState, setGameState] = useState<
    "idle" | "shaking" | "betting" | "result"
  >("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [bowlLifting, setBowlLifting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const betsRef = useRef(bets);
  const diceResultsRef = useRef(diceResults);
  const hasSyncedRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    betsRef.current = bets;
  }, [bets]);
  useEffect(() => {
    diceResultsRef.current = diceResults;
  }, [diceResults]);

  const totalBet = Object.values(bets).reduce(
    (sum, b) => (sum as number) + (b as number),
    0,
  );

  const addBet = useCallback(
    (id: SymbolId, amount?: number) => {
      const betAmt = amount || selectedChip;
      if (gameState !== "betting" || balance < betAmt) return;
      setBets((prev) => ({ ...prev, [id]: prev[id] + betAmt }));
      setBalance((prev: number) => prev - betAmt);
      // setGameResult(null); // Removed as gameResult state is commented out
    },
    [gameState, balance, selectedChip, setBalance],
  );

  // removeBet logic is no longer needed in the new UI, but kept as a ref if needed
  /*
  const removeBet = useCallback(
    (id: SymbolId) => {
      if (gameState !== "betting") return;
      ...
    },
    ...
  );
  */

  const clearBets = useCallback(() => {
    if (gameState !== "betting") return;
    setBalance((prev: number) => prev + (totalBet as number));
    setBets({ nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 });
    // setGameResult(null); // Removed as gameResult state is commented out
  }, [gameState, totalBet, setBalance]);

  const handleReveal = useCallback(() => {
    if (hasSyncedRef.current) return;
    setBowlLifting(true);
    setTimeout(() => {
      if (hasSyncedRef.current) return;
      hasSyncedRef.current = true;

      setGameState("result");
      setBowlLifting(false);

      const currentBets = betsRef.current;
      const currentDice = diceResultsRef.current;

      let totalWon = 0;
      let totalLost = 0;
      for (const sym of SYMBOLS) {
        const bet = currentBets[sym.id];
        if (bet <= 0) continue;
        const count = currentDice.filter((r) => r === sym.id).length;
        if (count > 0) {
          totalWon += bet + bet * count;
        } else {
          totalLost += bet;
        }
      }

      // We don't call setBalance here anymore to avoid conflict with onGameEnd
      // The parent will update the total balance.
      // We only update the local history.
      setHistory((prev) => [
        { dice: currentDice, won: totalWon, lost: totalLost },
        ...prev.slice(0, 14),
      ]);

      const netDelta =
        totalWon - Object.values(currentBets).reduce((a, b) => a + b, 0);
      if (onGameEnd && netDelta !== 0) onGameEnd(netDelta);
    }, 1000);
  }, [onGameEnd]);

  const startShaking = useCallback(() => {
    hasSyncedRef.current = false;
    setGameState("shaking");
    setBets({ nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 });
    // setGameResult(null); // Removed as gameResult state is commented out

    const finalResults: SymbolId[] = Array.from(
      { length: 3 },
      () => SYMBOLS[Math.floor(Math.random() * 6)].id,
    );

    setTimeout(() => {
      setDiceResults(finalResults);
      setGameState("betting");
      setTimeLeft(5);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleReveal();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 2000);
  }, [handleReveal]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto pb-10 px-4">
      {/* Header */}
      {/* Header with Background */}
      <div className="relative overflow-hidden rounded-t-[3rem] pt-8 pb-12 -mb-8 bg-[#cc0000]">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[url('https://www.transparenttextures.com/patterns/pinstripe-light.png')]" />
        </div>

        {/* Blossoms corners */}
        <div className="absolute top-0 left-0 w-40 h-40 opacity-80 rotate-180 pointer-events-none">
          <span className="text-4xl absolute top-4 left-4">🌸</span>
          <span className="text-2xl absolute top-12 left-16">🌸</span>
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 opacity-80 pointer-events-none">
          <span className="text-4xl absolute top-4 right-4 animate-pulse">
            🌸
          </span>
          <span className="text-2xl absolute top-12 right-16">🌸</span>
        </div>

        <div className="relative px-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-yellow-400 shadow-lg border-2 border-yellow-200 flex items-center justify-center text-red-700 hover:scale-110 active:scale-95 transition-all"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-black text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] uppercase tracking-wider">
              BẦU CUA TÔM CÁ
            </h1>
          </div>

          <button className="w-10 h-10 rounded-full bg-yellow-400 shadow-lg border-2 border-yellow-200 flex items-center justify-center text-red-700 hover:scale-110 active:scale-95 transition-all">
            <Volume2 size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Balance */}
      {/* Main Content Area: Side-by-Side Flex */}
      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Left Column: Bowl and Plate Area */}
        <div className="lg:w-[45%] w-full flex flex-col gap-4">
          {/* Balance Bar (Compact) */}
          <div className="relative z-10 w-full">
            <div className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 rounded-2xl p-3 shadow-[0_8px_16px_rgba(251,191,36,0.2)] border border-yellow-200/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-inner">
                  <Coins className="text-yellow-400" size={16} />
                </div>
                <div>
                  <p className="text-red-900/60 text-[8px] font-black uppercase leading-none mb-0.5">
                    Vốn liếng
                  </p>
                  <p className="text-red-900 text-lg font-black leading-none">
                    {balance.toLocaleString()}
                  </p>
                </div>
              </div>
              {(totalBet as number) > 0 && (
                <div className="bg-red-600 px-3 py-1 rounded-xl shadow-md border border-red-700">
                  <p className="text-white font-black text-xs uppercase tracking-tighter">
                    Cược: {totalBet as number}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Play Mat (Bowl zone) */}
          <div className="relative bg-[#cc0000] p-4 rounded-3xl shadow-2xl min-h-[420px] flex flex-col items-center justify-center border-4 border-yellow-500/30">
            {/* Visual background patterns */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')]" />

            <div className="relative w-64 h-64 scale-90 sm:scale-100 mb-4">
              {/* Plate */}
              <div className="absolute inset-0 bg-gray-100 rounded-full border-[10px] border-gray-300 shadow-2xl overflow-hidden">
                <div className="absolute inset-2 border-2 border-gray-400/20 rounded-full border-dashed" />
                {gameState === "result" && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 px-6">
                    {diceResults.map((r, i) => (
                      <div
                        key={i}
                        className="w-14 h-14 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center text-3xl animate-bounce-in"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        {SYMBOLS.find((s) => s.id === r)?.emoji}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bowl */}
              {(gameState === "shaking" ||
                gameState === "betting" ||
                bowlLifting) && (
                <div
                  className={`absolute inset-0 z-30 transition-all duration-700 ease-in-out ${bowlLifting ? "translate-y-[-120%] opacity-0 scale-125" : "translate-y-[-5%]"}`}
                >
                  <div
                    className={`relative w-full h-full ${gameState === "shaking" ? "animate-shake" : ""}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border-[10px] border-yellow-500 shadow-2xl flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')]" />

                      {/* Top Knob & Timer */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-24 h-24 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full border-4 border-yellow-500 shadow-xl flex items-center justify-center z-10">
                        {gameState === "betting" ? (
                          <p className="text-red-800 font-black text-2xl tracking-tighter">
                            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                          </p>
                        ) : (
                          <div className="w-12 h-12 bg-yellow-400/50 rounded-full border-2 border-yellow-200 shadow-inner" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Decorative Text */}
            <p className="font-serif italic text-yellow-400/60 text-[10px] mb-4 text-center">
              Bầu Cua Tôm Cá - Hết Kế Húp
            </p>

            {/* Main Action Control */}
            <div className="w-full max-w-[200px] flex flex-col gap-2 relative z-50">
              {(gameState === "idle" || gameState === "result") && (
                <button
                  onClick={startShaking}
                  className={`w-full py-3 rounded-full font-black text-sm shadow-xl border-b-4 transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${
                    gameState === "idle"
                      ? "bg-gradient-to-b from-yellow-300 to-orange-500 text-red-900 border-orange-800 active:translate-y-1 active:border-b-0"
                      : "bg-gradient-to-b from-blue-400 to-indigo-600 text-white border-indigo-900 active:translate-y-1 active:border-b-0"
                  }`}
                >
                  {gameState === "idle" ? (
                    <Dices size={18} />
                  ) : (
                    <RotateCcw size={18} />
                  )}
                  {gameState === "idle" ? "BẮT ĐẦU" : "TIẾP TỤC"}
                </button>
              )}
              {gameState === "result" && (
                <div className="animate-bounce-in text-center mt-2">
                  <p className="text-yellow-400 font-black text-xs drop-shadow-md flex items-center justify-center gap-1">
                    <Trophy size={14} /> KẾT QUẢ VÁN TRƯỚC VỪA XONG
                  </p>
                </div>
              )}
              {gameState === "betting" && (
                <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 text-center animate-pulse">
                  <p className="text-yellow-400 font-bold text-xs">
                    Đang nhận cược ({timeLeft}s)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Betting Zone */}
        <div className="lg:w-[55%] w-full flex flex-col gap-4">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border-t-8 border-yellow-400 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-red-800 font-black text-lg flex items-center gap-2">
                🏮 ĐẶT CƯỢC
              </h3>
              <button
                onClick={clearBets}
                disabled={gameState !== "betting" || (totalBet as number) === 0}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-20"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {SYMBOLS.map((sym) => {
                const bet = bets[sym.id];
                const matchCount =
                  gameState === "result"
                    ? diceResults.filter((r) => r === sym.id).length
                    : 0;
                const isWinner = gameState === "result" && matchCount > 0;

                return (
                  <button
                    key={sym.id}
                    onClick={() => addBet(sym.id)}
                    disabled={gameState !== "betting"}
                    className={`relative aspect-square sm:aspect-auto sm:h-28 bg-white rounded-2xl border-[3px] transition-all p-2 flex flex-col items-center justify-center group ${
                      bet > 0
                        ? "border-red-500 shadow-lg shadow-red-100"
                        : "border-gray-100 hover:border-gray-200"
                    } ${isWinner ? "animate-bounce ring-4 ring-yellow-400 z-10" : ""}`}
                  >
                    {isWinner && (
                      <div className="absolute -top-3 -right-3 w-7 h-7 bg-yellow-400 text-red-700 rounded-full flex items-center justify-center font-black text-xs shadow-lg border-2 border-white">
                        x{matchCount}
                      </div>
                    )}
                    <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform mb-1">
                      {sym.emoji}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                      {sym.label}
                    </span>
                    {bet > 0 && (
                      <div className="absolute bottom-1 right-1 bg-red-600 text-white min-w-[30px] px-1.5 py-0.5 rounded-full text-[9px] font-black shadow-md border border-white animate-bounce-in">
                        {bet.toLocaleString()}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Chip Selector */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
                Tiền cược
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 mb-2">
                {BET_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setSelectedChip(chip)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all border-2 ${
                      selectedChip === chip
                        ? "bg-red-600 border-red-700 text-white shadow-md -translate-y-0.5"
                        : "bg-white border-white text-gray-400 hover:border-red-200"
                    }`}
                  >
                    {chip >= 1000000
                      ? `${chip / 1000000}M`
                      : chip >= 1000
                        ? `${chip / 1000}K`
                        : chip}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedChip(balance)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all border-2 ${
                    selectedChip === balance
                      ? "bg-black border-black text-white shadow-md"
                      : "bg-white border-black/5 text-red-600 hover:bg-neutral-100"
                  }`}
                >
                  ALL IN 🔥
                </button>
              </div>
            </div>
          </div>

          {/* History (Clean look inside betting zone) */}
          <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] p-5 border border-white/20">
            <h4 className="text-gray-900 font-black text-[10px] uppercase tracking-widest mb-3 opacity-50 text-center">
              Lịch sử 5 ván gần nhất
            </h4>
            <div className="flex flex-col gap-2">
              {history.slice(0, 5).map((h: any, i: any) => (
                <div
                  key={`history-${i}`}
                  className="bg-white/80 rounded-xl p-3 flex items-center justify-between border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-bold text-gray-300">
                      #{history.length - i}
                    </span>
                    <div className="flex gap-1">
                      {h.dice.map((r: any, j: any) => (
                        <span key={j} className="text-lg">
                          {SYMBOLS.find((s) => s.id === r)?.emoji}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`font-black text-xs ${h.won > 0 ? "text-green-600" : "text-red-500"}`}
                  >
                    {h.won > 0 ? `+${h.won}` : h.lost > 0 ? `-${h.lost}` : "0"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
