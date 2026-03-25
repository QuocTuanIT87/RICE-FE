import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Coins, RefreshCw, Trophy, Info } from "lucide-react";
import {
  Card,
  createDeck,
  shuffleDeck,
  evaluateHand,
  canBeat,
  sortCards,
  HandInfo,
  getBotPlay,
  checkToiTrang,
  Rank,
  Suit,
} from "../utils/tienLenLogic";

interface TieLenGameProps {
  balance: number;
  setBalance: (fn: (prev: number) => number) => void;
  onBack: () => void;
  onGameEnd?: (delta: number) => void;
}

type GameResult = {
  type: "win" | "lose" | "toi_trang" | "bot_toi_trang";
  label: string;
  emoji: string;
  markup: number;
};

const BET_AMOUNTS = [1000, 5000, 10000, 50000];
const MAX_ALLOWED_BALANCE = 99000;

function suitColor(suit: Suit): string {
  return suit === "♥" || suit === "♦" ? "text-rose-600" : "text-slate-900";
}

// ============ PREMIUM CARD COMPONENT ============
function CardDisplay({
  card,
  index,
  hidden,
  selected,
  onClick,
}: {
  card: Card;
  index: number;
  hidden?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  if (hidden || !card.faceUp) {
    return (
      <div
        className="w-14 h-20 sm:w-20 sm:h-28 rounded-xl bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-900 border-2 border-indigo-400/50 shadow-2xl flex items-center justify-center animate-bounce-in relative overflow-hidden group"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent group-hover:scale-150 transition-transform duration-700"></div>
        <div className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
          🎴
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`w-14 h-20 sm:w-20 sm:h-28 rounded-xl bg-white border-2 ${
        selected
          ? "border-yellow-400 bg-yellow-50 -translate-y-16 shadow-[0_25px_50px_rgba(0,0,0,0.5)] z-50 ring-4 ring-yellow-400/30 scale-105"
          : "border-slate-200 hover:border-blue-400 hover:-translate-y-2 shadow-lg z-10"
      } flex flex-col items-center justify-between p-1 sm:p-2 relative animate-bounce-in transition-all duration-300 cursor-pointer overflow-hidden`}
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <div
        className={`self-start flex flex-col items-center leading-none ${suitColor(card.suit)}`}
      >
        <span className="text-[10px] sm:text-sm font-black tracking-tighter">
          {card.rank}
        </span>
        <span className="text-xs sm:text-base">{card.suit}</span>
      </div>

      <div
        className={`text-2xl sm:text-4xl filter drop-shadow-sm ${suitColor(card.suit)}`}
      >
        {card.suit}
      </div>

      <div
        className={`self-end flex flex-col items-center leading-none rotate-180 ${suitColor(card.suit)}`}
      >
        <span className="text-[10px] sm:text-sm font-black tracking-tighter">
          {card.rank}
        </span>
        <span className="text-xs sm:text-base">{card.suit}</span>
      </div>

      {selected && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-yellow-400 animate-pulse"></div>
      )}
    </div>
  );
}

// ============ MAIN GAME ============
export default function TienLenGame({
  balance,
  setBalance,
  onBack,
  onGameEnd,
}: TieLenGameProps) {
  const [gameState, setGameState] = useState<"betting" | "playing" | "result">(
    "betting",
  );
  const [currentBet, setCurrentBet] = useState(0);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [botHand, setBotHand] = useState<Card[]>([]);
  const [currentArea, setCurrentArea] = useState<HandInfo | null>(null);
  const [currentTurn, setCurrentTurn] = useState<"player" | "bot">("player");
  const [lastPlayer, setLastPlayer] = useState<"player" | "bot" | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const [message, setMessage] = useState<string>("");

  const initialBalanceRef = useRef(balance);

  const resetGame = () => {
    setGameState("betting");
    setCurrentBet(0);
    setPlayerHand([]);
    setBotHand([]);
    setCurrentArea(null);
    setResult(null);
    setSelectedIndices([]);
    setMessage("");
  };

  const addBet = (amount: number) => {
    if (balance < amount) return;
    setBalance((prev) => prev - amount);
    setCurrentBet((prev) => prev + amount);
  };

  const clearBet = () => {
    setBalance((prev) => prev + currentBet);
    setCurrentBet(0);
  };

  const setAllIn = () => {
    if (balance <= 0) return;
    const total = balance + currentBet;
    setBalance(() => 0);
    setCurrentBet(total);
  };

  const startGame = useCallback(() => {
    if (currentBet === 0) return;
    initialBalanceRef.current = balance + currentBet;

    const newDeck = shuffleDeck(createDeck());
    let pHand = newDeck.slice(0, 13).map((c) => ({ ...c, faceUp: true }));
    let bHand = newDeck.slice(13, 26).map((c) => ({ ...c, faceUp: false }));

    // RIGGING: Limit check
    if (initialBalanceRef.current + currentBet > MAX_ALLOWED_BALANCE) {
      const rRanks: Rank[] = [
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
        "A",
        "2",
      ];
      bHand = rRanks.map((r) => ({ suit: "♥", rank: r, faceUp: false }));
    }

    setPlayerHand(sortCards(pHand));
    setBotHand(sortCards(bHand));
    setCurrentArea({ type: "invalid", cards: [], highestPower: -1, length: 0 });
    setSelectedIndices([]);
    setResult(null);
    setMessage("Đến lượt bạn đánh bài!");
    setLastPlayer(null);

    const bToiTrang = checkToiTrang(bHand);
    const pToiTrang = checkToiTrang(pHand);

    if (bToiTrang) {
      setBotHand(bHand.map((c) => ({ ...c, faceUp: true })));
      setResult({
        type: "bot_toi_trang",
        label: `MÁY TỚI TRẮNG: ${bToiTrang}`,
        emoji: "🤖",
        markup: 0,
      });
      setGameState("result");
      return;
    }
    if (pToiTrang) {
      setResult({
        type: "toi_trang",
        label: `BẠN TỚI TRẮNG: ${pToiTrang}`,
        emoji: "👑",
        markup: 2,
      });
      setBalance((prev) => prev + currentBet * 2);
      setGameState("result");
      return;
    }

    setCurrentTurn("player");
    setGameState("playing");
  }, [currentBet, balance, setBalance]);

  const toggleCard = (idx: number) => {
    if (currentTurn !== "player") return;
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const playSelected = () => {
    if (currentTurn !== "player") return;
    if (selectedIndices.length === 0) return;

    const cards = selectedIndices.map((i) => playerHand[i]);
    const evaluated = evaluateHand(cards);

    if (evaluated.type === "invalid") {
      alert("⚠️ Bài không hợp lệ!");
      return;
    }

    if (
      currentArea &&
      currentArea.type !== "invalid" &&
      lastPlayer !== "player"
    ) {
      if (!canBeat(evaluated, currentArea)) {
        alert("⚠️ Không chặt được bài trên bàn!");
        return;
      }
    }

    setCurrentArea(evaluated);
    setLastPlayer("player");
    const newHand = playerHand.filter((_, i) => !selectedIndices.includes(i));
    setPlayerHand(newHand);
    setSelectedIndices([]);

    if (newHand.length === 0) {
      setResult({
        type: "win",
        label: "BẠN ĐÃ THẮNG!",
        emoji: "🏆",
        markup: 2,
      });
      setBalance((prev) => prev + currentBet * 2);
      setGameState("result");
    } else {
      setCurrentTurn("bot");
      setMessage("Máy đang suy nghĩ...");
    }
  };

  const skipTurn = () => {
    if (currentTurn !== "player") return;
    if (lastPlayer === "player" || lastPlayer === null) {
      alert("⚠️ Đang nắm cái, bạn phải đánh bài!");
      return;
    }

    setLastPlayer("bot");
    setCurrentArea({ type: "invalid", cards: [], highestPower: -1, length: 0 });
    setCurrentTurn("bot");
    setMessage("Bạn đã bỏ lượt. Máy đang đi...");
  };

  const sortPlayerCards = () => setPlayerHand(sortCards(playerHand));

  // Bot Logic
  useEffect(() => {
    if (gameState !== "playing" || currentTurn !== "bot") return;

    const timer = setTimeout(() => {
      let effectiveArea = currentArea;
      if (lastPlayer === "bot") {
        effectiveArea = {
          type: "invalid",
          cards: [],
          highestPower: -1,
          length: 0,
        };
        setCurrentArea(effectiveArea);
      }

      const botFaceUp = botHand.map((c) => ({ ...c, faceUp: true }));
      const play = getBotPlay(botFaceUp, effectiveArea!);

      if (play.length > 0) {
        const evalPlay = evaluateHand(play);
        setCurrentArea(evalPlay);
        setLastPlayer("bot");
        const newBotHand = botHand.filter(
          (c) => !play.some((pc) => pc.rank === c.rank && pc.suit === c.suit),
        );
        setBotHand(newBotHand);

        if (newBotHand.length === 0) {
          setBotHand([]);
          setResult({
            type: "lose",
            label: "MÁY ĐÃ THẮNG!",
            emoji: "💀",
            markup: 0,
          });
          setGameState("result");
        } else {
          setCurrentTurn("player");
          setMessage("Đến lượt bạn!");
        }
      } else {
        setLastPlayer("player");
        setCurrentArea({
          type: "invalid",
          cards: [],
          highestPower: -1,
          length: 0,
        });
        setCurrentTurn("player");
        setMessage("Máy bỏ lượt. Mời bạn đánh!");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentTurn, gameState, botHand, lastPlayer]);

  useEffect(() => {
    if (gameState === "result" && result && onGameEnd) {
      const delta =
        result.type === "win" || result.type === "toi_trang"
          ? currentBet
          : -currentBet;
      onGameEnd(delta);
    }
  }, [gameState]);

  return (
    <div className="flex flex-col flex-1 bg-[#0a2e1f] relative font-sans text-white select-none transition-all duration-700">
      {/* Premium Background Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#ffffff 0.5px, transparent 0.5px)",
          backgroundSize: "20px 20px",
        }}
      ></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent pointer-events-none"></div>

      {/* Header */}
      <header className="px-6 py-2 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center z-50 shadow-2xl">
        <button
          onClick={() => {
            if (gameState === "playing") {
              if (
                window.confirm("Thoát ván chơi sẽ mất tiền cược. Chắc không?")
              )
                onBack();
            } else onBack();
          }}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-emerald-400"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 animate-pulse">
            TIẾN LÊN MIỀN NAM
          </h1>
          <div className="text-[10px] font-bold text-white/40 tracking-[0.4em]">
            ELITE SOLO CHAMPIONSHIP
          </div>
        </div>

        <div className="flex items-center gap-3 bg-emerald-900/50 px-4 py-2 rounded-2xl border border-emerald-400/20">
          <Coins className="text-yellow-400" size={18} />
          <span className="font-black text-emerald-50 text-lg tabular-nums">
            {balance.toLocaleString()}
          </span>
        </div>
      </header>

      {/* Game Table Content */}
      <main className="flex-1 flex flex-col justify-between p-4 relative">
        {/* Betting Overlay */}
        {gameState === "betting" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in backdrop-blur-[2px] bg-black/60 overflow-hidden">
            <div className="w-full max-w-xl max-h-full overflow-y-auto bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.9)] flex flex-col items-center p-6 sm:p-10 relative custom-scrollbar">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-emerald-500 to-yellow-500 rounded-t-full"></div>

              <div className="w-20 h-20 bg-emerald-600/20 rounded-[2rem] flex items-center justify-center mb-6 border border-emerald-500/30">
                <Coins
                  size={40}
                  className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black mb-1 uppercase tracking-tight text-white">
                Vào Bàn Cược
              </h2>
              <p className="text-white/40 text-xs sm:text-sm font-medium mb-4 sm:mb-8 italic text-center">
                Đạo hữu chọn mức cược để bắt đầu ván đấu
              </p>

              <div className="text-4xl sm:text-5xl font-black mb-6 sm:mb-10 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)] tabular-nums">
                {currentBet.toLocaleString()}
                <span className="text-base sm:text-lg ml-2 opacity-50">xu</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3 w-full mb-6 sm:mb-8">
                {BET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => addBet(amt)}
                    className="h-12 bg-white/5 hover:bg-emerald-600/20 border border-white/10 hover:border-emerald-500/50 rounded-2xl text-xs font-black transition-all active:scale-90 flex items-center justify-center text-white/80 hover:text-white"
                  >
                    +{amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 w-full mb-6 sm:mb-10">
                <button
                  onClick={clearBet}
                  className="flex-1 h-12 sm:h-14 border border-rose-500/50 text-rose-500 rounded-[1.2rem] sm:rounded-[1.5rem] font-black text-xs sm:text-sm hover:bg-rose-500/10 transition-all uppercase tracking-widest active:scale-95"
                >
                  Xóa
                </button>
                <button
                  onClick={setAllIn}
                  className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-orange-600 to-rose-600 text-white rounded-[1.2rem] sm:rounded-[1.5rem] font-black text-xs sm:text-sm shadow-xl active:scale-95 uppercase tracking-widest ring-4 ring-orange-500/10 transition-all"
                >
                  Tất Tay
                </button>
              </div>

              <button
                onClick={startGame}
                disabled={currentBet === 0}
                className="w-full h-16 sm:h-20 bg-gradient-to-b from-yellow-300 to-yellow-600 text-slate-900 rounded-[1.5rem] sm:rounded-[2rem] font-black text-xl sm:text-2xl shadow-[0_15px_40px_rgba(234,179,8,0.4)] hover:shadow-[0_20px_50px_rgba(234,179,8,0.6)] disabled:opacity-20 disabled:grayscale transition-all uppercase tracking-[0.2em] active:translate-y-1 relative group shrink-0"
              >
                <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem] sm:rounded-[2rem]"></div>
                <span className="relative z-10">CHIA BÀI 🃏</span>
              </button>
            </div>
          </div>
        )}

        {/* Bot Deck Area */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-900/60 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 mb-2 flex items-center gap-3 shadow-xl">
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-black uppercase tracking-widest text-rose-100">
              AI BOT ELITE
            </span>
            <span className="w-1 h-4 bg-white/10 mx-1"></span>
            <span className="text-xs font-bold opacity-60 italic">
              {botHand.length} lá
            </span>
          </div>

          <div className="flex space-x-1 transition-all duration-500 scale-75 origin-top filter drop-shadow-2xl">
            {botHand.map((c, i) => (
              <CardDisplay
                key={i}
                card={c}
                index={i}
                hidden={gameState !== "result"}
              />
            ))}
          </div>
        </div>

        {/* Central Play Area (The Pit) */}
        <div className="flex-1 flex flex-col items-center justify-center relative min-h-[120px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-transparent to-transparent"></div>

          <div className="relative z-10 w-full max-w-full bg-black/10 rounded-[2rem] border border-white/5 flex items-center justify-center shadow-inner overflow-hidden min-h-[180px] sm:min-h-[240px]">
            <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full"></div>

            {currentArea && currentArea.cards.length > 0 ? (
              <div className="flex space-x-1 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] animate-fade-in-up">
                {currentArea.cards.map((c, i) => (
                  <CardDisplay key={i} card={c} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-10 animate-pulse">
                <Trophy size={80} />
                <span className="mt-4 font-black tracking-[0.5em] uppercase text-sm">
                  HẠ BÀI TẠI ĐÂY
                </span>
              </div>
            )}
          </div>

          {gameState === "playing" && (
            <div className="mt-2 px-6 py-1 bg-emerald-500/10 border border-emerald-400/30 rounded-full flex items-center gap-3 animate-fade-in">
              <Info size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase text-emerald-100 tracking-wider italic">
                {message}
              </span>
            </div>
          )}
        </div>

        {/* Player Controls & Hand */}
        <div className="mt-2 flex flex-col items-center">
          {gameState === "playing" && (
            <div className="flex items-center gap-3 w-full max-w-md mb-4 px-4">
                  <button
                         onClick={skipTurn}
                         disabled={currentTurn !== "player" || lastPlayer === "player" || lastPlayer === null}
                         className="flex-1 py-3 bg-slate-800 border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 disabled:opacity-30 transition-all active:scale-95"
                  >            BỎ LƯỢT
              </button>

                  <button
                         onClick={playSelected}
                         disabled={currentTurn !== "player" || selectedIndices.length === 0}
                         className="flex-[2] py-3 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95"
                  >            <span className="relative z-10">ĐÁNH BÀI</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

                  <button
                         onClick={sortPlayerCards}
                         className="flex-1 py-3 bg-blue-900/40 border-blue-400/20 text-blue-100 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95"
                  >            XẾP
              </button>
            </div>
          )}

          <div className="flex space-x-1 sm:space-x-2 origin-bottom transition-all duration-300 mb-2">
            {playerHand.map((c, i) => (
              <CardDisplay
                key={i}
                card={c}
                index={i}
                selected={selectedIndices.includes(i)}
                onClick={() => toggleCard(i)}
              />
            ))}
          </div>

            <div className="flex items-center gap-2 opacity-30 mt-2 font-black text-[8px] tracking-[0.4em] uppercase">
            <span className="w-12 h-px bg-white"></span>
            BẠN ĐANG CẦM BÀI
            <span className="w-12 h-px bg-white"></span>
          </div>
        </div>

        {/* Result Screen */}
        {gameState === "result" && result && (
          <div className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-[#111] rounded-[4rem] border-2 border-yellow-500/50 p-12 max-w-md w-full text-center shadow-[0_0_100px_rgba(16,185,129,0.2)] relative overflow-hidden">
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-[80px]"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-[80px]"></div>

              <div className="text-8xl mb-8 animate-bounce filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {result.emoji}
              </div>
              <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                {result.label}
              </h2>

              <div
                className={`text-4xl font-black mb-12 tabular-nums ${result.markup > 0 ? "text-emerald-400" : "text-rose-500"}`}
              >
                {result.markup > 0 ? "+" : "-"}
                {currentBet.toLocaleString()} xu
              </div>

              <button
                onClick={resetGame}
                className="w-full h-20 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 group"
              >
                <RefreshCw
                  size={24}
                  className="group-hover:rotate-180 transition-transform duration-700"
                />
                TIẾP TỤC SÁT PHẠT
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification Style Legend */}
      {selectedIndices.length > 0 && currentTurn === "player" && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/95 border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.5)] animate-fade-in-down backdrop-blur-md">
          <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-slate-900 font-bold">
            {selectedIndices.length}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-white/50 tracking-widest leading-none">
              Bạn đã chọn
            </span>
            <span className="text-sm font-bold text-emerald-400 leading-tight">
              Sẵn sàng đánh bài!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
