import { useState, useCallback, useMemo } from "react";
import {
  RotateCcw,
  Hand,
  Plus,
  Coins,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

// ============ TYPES ============
type Suit = "♠" | "♥" | "♦" | "♣";
type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

type GameState = "betting" | "playing" | "dealerTurn" | "result";
type ResultType =
  | "xi_ban"
  | "xi_dach"
  | "ngu_linh"
  | "win"
  | "lose"
  | "draw"
  | "bust"
  | "dealer_bust";

interface GameResult {
  type: ResultType;
  label: string;
  emoji: string;
  isWin: boolean;
  multiplier: number; // 1 = normal, 2 = double
}

// ============ HELPERS ============
const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = [
  "A",
  "2",
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
];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS)
    for (const rank of RANKS) deck.push({ suit, rank, faceUp: true });
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function cardValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (["K", "Q", "J"].includes(rank)) return 10;
  return parseInt(rank);
}

function handScore(cards: Card[]): number {
  let score = 0;
  let aces = 0;
  for (const c of cards) {
    if (!c.faceUp) continue;
    score += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handScore(cards) === 21;
}

function isXiBan(cards: Card[]): boolean {
  return cards.length === 2 && cards.every((c) => c.rank === "A");
}

function suitColor(suit: Suit): string {
  return suit === "♥" || suit === "♦" ? "text-red-500" : "text-gray-900";
}

// ============ CARD COMPONENT ============
function CardDisplay({
  card,
  index,
  hidden,
}: {
  card: Card;
  index: number;
  hidden?: boolean;
}) {
  if (hidden || !card.faceUp) {
    return (
      <div
        className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 border-2 border-blue-400 shadow-lg flex items-center justify-center animate-bounce-in"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <span className="text-2xl">🃏</span>
      </div>
    );
  }

  return (
    <div
      className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-white border-2 border-gray-200 shadow-lg flex flex-col items-center justify-center relative animate-bounce-in ${suitColor(card.suit)}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <span className="absolute top-1 left-2 text-[10px] sm:text-xs font-black">
        {card.rank}
      </span>
      <span className="text-xl sm:text-2xl">{card.suit}</span>
      <span className="absolute bottom-1 right-2 text-[10px] sm:text-xs font-black rotate-180">
        {card.rank}
      </span>
    </div>
  );
}

// ============ PROPS ============
interface XiDachGameProps {
  balance: number;
  setBalance: (fn: (prev: number) => number) => void;
  onBack: () => void;
}

// ============ MAIN GAME ============
export default function XiDachGame({
  balance,
  setBalance,
  onBack,
}: XiDachGameProps) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [currentBet, setCurrentBet] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [selectedChip, setSelectedChip] = useState(10);

  const playerScore = useMemo(() => handScore(playerCards), [playerCards]);
  const dealerScore = useMemo(() => {
    if (gameState === "result") return handScore(dealerCards);
    return handScore(dealerCards.filter((c) => c.faceUp));
  }, [dealerCards, gameState]);

  const chips = [10, 20, 50, 100];

  // ---- DEAL ----
  const startGame = useCallback(() => {
    if (currentBet <= 0) return;

    const newDeck = shuffleDeck(createDeck());
    const pCards = [
      { ...newDeck[0], faceUp: true },
      { ...newDeck[1], faceUp: true },
    ];
    const dCards = [
      { ...newDeck[2], faceUp: true },
      { ...newDeck[3], faceUp: false }, // hidden card
    ];

    setDeck(newDeck.slice(4));
    setPlayerCards(pCards);
    setDealerCards(dCards);
    setResult(null);

    // Check Xì Bàn / Xì Dách immediately
    if (isXiBan(pCards)) {
      const dCardsRevealed = dCards.map((c) => ({ ...c, faceUp: true }));
      setDealerCards(dCardsRevealed);
      const res: GameResult = {
        type: "xi_ban",
        label: "XÌ BÀN!",
        emoji: "👑",
        isWin: true,
        multiplier: 2,
      };
      setResult(res);
      setBalance((prev) => prev + currentBet * 3); // bet back + 2x win
      setGameState("result");
      return;
    }
    if (isBlackjack(pCards)) {
      const dCardsRevealed = dCards.map((c) => ({ ...c, faceUp: true }));
      setDealerCards(dCardsRevealed);
      if (isBlackjack(dCardsRevealed)) {
        const res: GameResult = {
          type: "draw",
          label: "HÒA!",
          emoji: "🤝",
          isWin: false,
          multiplier: 0,
        };
        setResult(res);
        setBalance((prev) => prev + currentBet); // return bet
      } else {
        const res: GameResult = {
          type: "xi_dach",
          label: "XÌ DÁCH!",
          emoji: "🎰",
          isWin: true,
          multiplier: 1,
        };
        setResult(res);
        setBalance((prev) => prev + currentBet * 2);
      }
      setGameState("result");
      return;
    }

    setGameState("playing");
  }, [currentBet, setBalance]);

  // ---- HIT ----
  const hit = useCallback(() => {
    if (deck.length === 0) return;
    const newCard = { ...deck[0], faceUp: true };
    const newPlayerCards = [...playerCards, newCard];
    const newDeck = deck.slice(1);
    setDeck(newDeck);
    setPlayerCards(newPlayerCards);

    const score = handScore(newPlayerCards);

    // Check Ngũ Linh
    if (newPlayerCards.length >= 5 && score <= 21) {
      const dRevealed = dealerCards.map((c) => ({ ...c, faceUp: true }));
      setDealerCards(dRevealed);
      const res: GameResult = {
        type: "ngu_linh",
        label: "NGŨ LINH!",
        emoji: "🐉",
        isWin: true,
        multiplier: 2,
      };
      setResult(res);
      setBalance((prev) => prev + currentBet * 3);
      setGameState("result");
      return;
    }

    // Bust - nhà cái vẫn phải bốc thêm bài
    if (score > 21) {
      const dRevealed = dealerCards.map((c) => ({ ...c, faceUp: true }));
      let currentDealerCards = [...dRevealed];
      let remainingDeck = [...newDeck];

      // Nhà cái bốc thêm đến khi >= 16
      while (handScore(currentDealerCards) < 16 && remainingDeck.length > 0) {
        currentDealerCards.push({ ...remainingDeck[0], faceUp: true });
        remainingDeck = remainingDeck.slice(1);
      }

      setDealerCards(currentDealerCards);
      setDeck(remainingDeck);

      const dealerFinalScore = handScore(currentDealerCards);

      if (dealerFinalScore > 21) {
        // Cả hai cùng quắc → HÒA
        const res: GameResult = {
          type: "draw",
          label: "CẢ HAI CÙNG QUẮC - HÒA!",
          emoji: "🤝",
          isWin: false,
          multiplier: 0,
        };
        setResult(res);
        setBalance((prev) => prev + currentBet); // trả lại tiền cược
      } else {
        // Chỉ người chơi quắc → THUA
        const res: GameResult = {
          type: "bust",
          label: "QUÁ 21 - QUẮC!",
          emoji: "💥",
          isWin: false,
          multiplier: 0,
        };
        setResult(res);
      }
      setGameState("result");
      return;
    }
  }, [deck, playerCards, dealerCards, currentBet, setBalance]);

  // ---- STAND ----
  const stand = useCallback(() => {
    // Reveal dealer card
    const dRevealed = dealerCards.map((c) => ({ ...c, faceUp: true }));
    let currentDealerCards = [...dRevealed];
    let currentDeck = [...deck];

    // Dealer draws until 17+
    while (handScore(currentDealerCards) < 17 && currentDeck.length > 0) {
      currentDealerCards.push({ ...currentDeck[0], faceUp: true });
      currentDeck = currentDeck.slice(1);
    }

    setDealerCards(currentDealerCards);
    setDeck(currentDeck);

    const dScore = handScore(currentDealerCards);
    const pScore = handScore(playerCards);

    let res: GameResult;

    if (dScore > 21) {
      res = {
        type: "dealer_bust",
        label: "NHÀ CÁI QUẮC!",
        emoji: "🎉",
        isWin: true,
        multiplier: 1,
      };
      setBalance((prev) => prev + currentBet * 2);
    } else if (pScore > dScore) {
      res = {
        type: "win",
        label: "THẮNG!",
        emoji: "🏆",
        isWin: true,
        multiplier: 1,
      };
      setBalance((prev) => prev + currentBet * 2);
    } else if (pScore < dScore) {
      res = {
        type: "lose",
        label: "THUA!",
        emoji: "😢",
        isWin: false,
        multiplier: 0,
      };
    } else {
      res = {
        type: "draw",
        label: "HÒA!",
        emoji: "🤝",
        isWin: false,
        multiplier: 0,
      };
      setBalance((prev) => prev + currentBet);
    }

    setResult(res);
    setGameState("result");
  }, [dealerCards, deck, playerCards, currentBet, setBalance]);

  // ---- NEW ROUND ----
  const newRound = useCallback(() => {
    setPlayerCards([]);
    setDealerCards([]);
    setCurrentBet(0);
    setResult(null);
    setGameState("betting");
  }, []);

  const addBet = useCallback(
    (amount: number) => {
      if (balance < amount) return;
      setCurrentBet((prev) => prev + amount);
      setBalance((prev) => prev - amount);
    },
    [balance, setBalance],
  );

  const clearBet = useCallback(() => {
    setBalance((prev) => prev + currentBet);
    setCurrentBet(0);
  }, [currentBet, setBalance]);

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
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900">🃏 Xì Dách</h1>
        </div>
        <div className="w-20" /> {/* spacer */}
      </div>

      {/* Balance */}
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-2xl p-3.5 mb-5 shadow-lg shadow-purple-200/50">
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
          {currentBet > 0 && (
            <div className="bg-white/20 rounded-xl px-3 py-1.5 backdrop-blur-sm">
              <p className="text-white/70 text-[10px] font-bold">Cược</p>
              <p className="text-white text-sm font-black text-right">
                {currentBet} xu
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== GAME TABLE ===== */}
      <div className="bg-gradient-to-b from-green-700 via-emerald-800 to-green-900 rounded-3xl p-5 mb-5 shadow-2xl border-2 border-green-600/50 min-h-[300px] relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-4 left-4 text-7xl">♠</div>
          <div className="absolute bottom-4 right-4 text-7xl">♥</div>
        </div>

        {/* DEALER */}
        {dealerCards.length > 0 && (
          <div className="relative mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
                Nhà cái
              </span>
              <span className="bg-white/10 text-white/80 text-xs font-black px-2 py-0.5 rounded-md">
                {gameState === "result" ? dealerScore : "?"}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {dealerCards.map((card, i) => (
                <CardDisplay
                  key={i}
                  card={card}
                  index={i}
                  hidden={!card.faceUp}
                />
              ))}
            </div>
          </div>
        )}

        {/* VS Divider */}
        {dealerCards.length > 0 && (
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs font-black">VS</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        )}

        {/* PLAYER */}
        {playerCards.length > 0 && (
          <div className="relative mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
                Bạn
              </span>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-md ${
                  playerScore > 21
                    ? "bg-red-500/30 text-red-300"
                    : "bg-white/10 text-white/80"
                }`}
              >
                {playerScore}
              </span>
              {isBlackjack(playerCards) && (
                <span className="bg-yellow-400/20 text-yellow-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                  XÌ DÁCH
                </span>
              )}
              {isXiBan(playerCards) && (
                <span className="bg-purple-400/20 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                  XÌ BÀN
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {playerCards.map((card, i) => (
                <CardDisplay key={i} card={card} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div
            className={`text-center py-3 px-4 rounded-2xl animate-bounce-in ${
              result.isWin
                ? "bg-gradient-to-r from-yellow-400/30 to-amber-400/30 border border-yellow-300/40"
                : result.type === "draw"
                  ? "bg-gradient-to-r from-blue-400/20 to-cyan-400/20 border border-blue-300/30"
                  : "bg-gradient-to-r from-red-400/20 to-rose-400/20 border border-red-300/30"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{result.emoji}</span>
              <span
                className={`font-black text-xl ${
                  result.isWin
                    ? "text-yellow-300"
                    : result.type === "draw"
                      ? "text-blue-300"
                      : "text-red-300"
                }`}
              >
                {result.label}
              </span>
            </div>
            {result.isWin && (
              <p className="text-yellow-200/80 text-sm font-bold mt-1">
                +{currentBet * (result.multiplier + 1)} xu
                {result.multiplier === 2 && " (Thưởng x2!)"}
              </p>
            )}
          </div>
        )}

        {/* BETTING STATE */}
        {gameState === "betting" && playerCards.length === 0 && (
          <div className="relative text-center py-10">
            <div className="text-5xl mb-3">🃏</div>
            <p className="text-white/50 text-sm font-bold">
              Đặt cược rồi bấm CHIA BÀI
            </p>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="relative flex items-center justify-center gap-3 mt-4">
          {gameState === "betting" && (
            <button
              onClick={startGame}
              disabled={currentBet <= 0}
              className={`inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-lg font-black transition-all ${
                currentBet <= 0
                  ? "bg-gray-500/50 text-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 text-white shadow-xl shadow-amber-400/40 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
              }`}
            >
              <Sparkles size={20} />
              CHIA BÀI
            </button>
          )}

          {gameState === "playing" && (
            <>
              <button
                onClick={hit}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-400/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <Plus size={18} />
                RÚT
              </button>
              <button
                onClick={stand}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-400/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <Hand size={18} />
                DỪNG
              </button>
            </>
          )}

          {gameState === "result" && (
            <button
              onClick={newRound}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-400/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <RotateCcw size={18} />
              VÁN MỚI
            </button>
          )}
        </div>
      </div>

      {/* ===== CHIP SELECTOR (only in betting) ===== */}
      {gameState === "betting" && (
        <>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-gray-500">
              💰 Chọn mệnh giá:
            </span>
            {currentBet > 0 && (
              <button
                onClick={clearBet}
                className="text-xs text-red-400 hover:text-red-500 font-bold transition-colors"
              >
                ↩️ Hủy cược
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2 mb-5">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setSelectedChip(chip);
                  addBet(chip);
                }}
                disabled={balance < chip}
                className={`relative py-3 rounded-xl text-sm font-black transition-all ${
                  balance < chip
                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                    : selectedChip === chip
                      ? "bg-gradient-to-b from-purple-400 to-indigo-500 text-white shadow-lg shadow-purple-200 scale-105 ring-2 ring-purple-300 ring-offset-2"
                      : "bg-white text-gray-600 border-2 border-gray-200 hover:border-purple-300 hover:text-purple-600"
                }`}
              >
                +{chip} xu
              </button>
            ))}
            <button
              onClick={() => {
                if (balance > 0) addBet(balance);
              }}
              disabled={balance <= 0}
              className={`relative py-3 rounded-xl text-sm font-black transition-all ${
                balance <= 0
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-b from-red-500 to-rose-600 text-white shadow-lg shadow-red-200 hover:shadow-xl hover:scale-105 active:scale-100"
              }`}
            >
              ALL IN 🔥
            </button>
          </div>
        </>
      )}

      {/* ===== RULES ===== */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-4 border border-gray-100">
        <p className="text-xs font-bold text-gray-400 mb-2">📖 Luật chơi</p>
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            • <strong>Mục tiêu:</strong> Tổng điểm gần <strong>21</strong> nhất,
            không vượt quá 21
          </p>
          <p>
            • <strong>A</strong> = 1 hoặc 11 | <strong>J, Q, K</strong> = 10 |{" "}
            <strong>2-10</strong> = đúng mệnh giá
          </p>
          <p>
            • 🎰 <strong>Xì Dách</strong> (A + 10/J/Q/K) = thưởng x2
          </p>
          <p>
            • 👑 <strong>Xì Bàn</strong> (2 lá A) = thưởng x2
          </p>
          <p>
            • 🐉 <strong>Ngũ Linh</strong> (5 lá ≤ 21) = thưởng x2
          </p>
        </div>
      </div>
    </div>
  );
}
