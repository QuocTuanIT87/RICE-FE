import { useState, useEffect } from "react";
import {
  ArrowLeft,
  RotateCcw,
  Coins,
  Dices,
  Trophy,
  User as UserIcon,
  Crown,
  Timer,
} from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { useAppSelector } from "@/store/hooks";
import { useToast } from "@/hooks/useToast";

// ============ TYPES & CONSTANTS ============
type SymbolId = "nai" | "bau" | "ga" | "ca" | "cua" | "tom";

interface SymbolInfo {
  id: SymbolId;
  emoji: string;
  label: string;
  gradient: string;
  shadow: string;
  ring: string;
}

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

const BET_CHIPS = [
  1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000,
];

interface MultiBauCuaGameProps {
  roomIdx: number;
  balance: number;
  onBack: () => void;
}

export default function MultiBauCuaGame({
  roomIdx,
  balance,
  onBack,
}: MultiBauCuaGameProps) {
  const { socket } = useSocket();
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [room, setRoom] = useState<any>(null);
  const [selectedChip, setSelectedChip] = useState(1000);
  const [isShaking, setIsShaking] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<string[]>([]);
  const [lastPayouts, setLastPayouts] = useState<any[]>([]);
  const [bowlLifting, setBowlLifting] = useState(false);

  useEffect(() => {
    if (!socket || !user) return;

    // Join room
    socket.emit("baucua:join_room", { roomIdx, user });

    // Listeners
    socket.on("baucua:room_state", (state) => {
      setRoom(state);
      if (state.status === "BETTING") setIsShaking(false);
      if (state.status === "RESULT") {
        setShowResult(true);
        setLastResult(state.lastResult || []);
        setLastPayouts(state.lastPayouts || []);
      }
    });

    socket.on("baucua:player_joined", ({ player, message }) => {
      setRoom((prev: any) => {
        if (!prev) return prev;
        // Check if player already exists
        const exists = prev.players?.find(
          (p: any) => p.userId === player.userId,
        );
        if (exists) return prev;
        return {
          ...prev,
          players: [...(prev.players || []), player],
        };
      });
      toast({ title: "Chào mừng hội viên!", description: message });
    });

    socket.on("baucua:player_left", ({ userId }) => {
      setRoom((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players?.filter((p: any) => p.userId !== userId),
        };
      });
    });

    socket.on("baucua:new_dealer", ({ dealerId, message }) => {
      setRoom((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          dealerId,
          players: prev.players?.map((p: any) => ({
            ...p,
            isDealer: p.userId === dealerId,
          })),
        };
      });
      toast({ title: "Thông báo từ sòng!", description: message });
    });

    socket.on("baucua:round_start", ({ status, timer }) => {
      setRoom((prev: any) => ({ ...prev, status, timer, bets: [] }));
      setIsShaking(true);
      setShowResult(false);
      setBowlLifting(false);
      setTimeout(() => setIsShaking(false), 2000);
    });

    socket.on("baucua:timer", (timer) => {
      setRoom((prev: any) => ({ ...prev, timer }));
    });

    socket.on("baucua:bet_placed", (data) => {
      // Update global room bets and totals
      setRoom((prev: any) => {
        if (!prev) return prev;
        const newBets = [...(prev.bets || []), data];
        // Only update balance, don't touch other properties to avoid role reset
        const newPlayers = prev.players.map((p: any) =>
          p.userId === data.userId ? { ...p, gameCoins: data.newBalance } : p,
        );
        return { ...prev, bets: newBets, players: newPlayers };
      });
    });

    socket.on("baucua:result", ({ dice, payouts }) => {
      setLastResult(dice);
      setLastPayouts(payouts);
      setBowlLifting(true);

      setTimeout(() => {
        setShowResult(true);
        setBowlLifting(false);

        // Update player coin counts in their avatar list immediately
        setRoom((prev: any) => {
          if (!prev) return prev;
          const updatedPlayers = prev.players.map((plyr: any) => {
            const payout = payouts.find((po: any) => po.userId === plyr.userId);
            if (payout) {
              return {
                ...plyr,
                gameCoins: payout.finalBalance || 0,
              };
            }
            return plyr;
          });
          return { ...prev, players: updatedPlayers };
        });

        // Update local balance state for header/ui
        // REMOVED: Rely on global socket service sync to prevent double-updates
        const currentId = (user?._id || user?.id)?.toString();
        const myPayout = payouts.find((p: any) => p.userId === currentId);
        if (myPayout) {
          if (isDealer) {
            toast({
              title: myPayout.netDelta >= 0 ? "💰 THU TIỀN!" : "💸 CHI TIỀN!",
              description:
                myPayout.netDelta >= 0
                  ? `Nhà Cái vừa thắng ${myPayout.netDelta.toLocaleString()} xu từ người chơi!`
                  : `Nhà Cái vừa phải trả ${Math.abs(myPayout.netDelta).toLocaleString()} xu cho người thắng!`,
            });
          } else {
            if (myPayout.netDelta > 0) {
              toast({
                title: "🎉 THẮNG LỚN!",
                description: `Bạn vừa nhận được ${myPayout.netDelta.toLocaleString()} xu từ Nhà Cái!`,
              });
            } else if (myPayout.netDelta < 0) {
              toast({
                title: "💸 Chia buồn!",
                description: `Cố gắng ở ván sau nhé!`,
              });
            }
          }
        }
      }, 1000);
    });

    socket.on("baucua:status", (status) => {
      setRoom((prev: any) => ({ ...prev, status }));
      if (status === "IDLE") setShowResult(false);
    });

    return () => {
      socket.emit("baucua:leave_room");
      socket.off("baucua:room_state");
      socket.off("baucua:player_joined");
      socket.off("baucua:player_left");
      socket.off("baucua:new_dealer");
      socket.off("baucua:round_start");
      socket.off("baucua:timer");
      socket.off("baucua:bet_placed");
      socket.off("baucua:result");
      socket.off("baucua:status");
    };
  }, [socket, roomIdx, user?.id, user?._id, toast]);

  const handleStartRound = () => {
    socket?.emit("baucua:start_round", { roomId: room?.id });
  };

  const handlePlaceBet = (mascot: string) => {
    if (!room || room.status !== "BETTING" || isShaking) return;
    const currentUserId = (user?._id || user?.id)?.toString();
    if (room.dealerId === currentUserId) {
      toast({
        variant: "destructive",
        title: "Lỗi!",
        description: "Nhà Cái không thể đặt cược!",
      });
      return;
    }
    if (balance < selectedChip) {
      toast({
        variant: "destructive",
        title: "Lỗi!",
        description: "Không đủ xu rồi đại gia ơi!",
      });
      return;
    }

    socket?.emit("baucua:place_bet", {
      roomId: room.id,
      mascot,
      amount: selectedChip,
    });
  };

  const currentUserId = (user?._id || user?.id)?.toString();
  const isDealer = room?.dealerId === currentUserId;

  if (!room) return null;

  const handleBackWithCheck = () => {
    const myBets =
      room.bets?.filter((b: any) => b.userId === currentUserId) || [];
    if (myBets.length > 0 && room.status === "BETTING") {
      const confirmLeave = window.confirm(
        "Đạo hữu đang có cược trong ván này! Nếu thoát bây giờ sẽ bị mất trắng số xu đã cược. Đạo hữu chắc chắn muốn thoát chứ? 💸",
      );
      if (!confirmLeave) return;
    }
    onBack();
  };

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-gray-900 via-gray-800 to-black rounded-[3rem] p-4 sm:p-8 relative overflow-hidden shadow-2xl border-4 border-gray-700/50">
      {/* Table background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent animate-pulse" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <button
          onClick={handleBackWithCheck}
          className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all backdrop-blur-md border border-white/10"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center">
          <h1 className="text-2xl font-black text-white flex items-center gap-2 justify-center drop-shadow-lg">
            <Dices className="text-orange-400" />
            Sòng {room.name}
          </h1>
          <div className="flex items-center gap-2 justify-center mt-1">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${room.status === "BETTING" ? "bg-green-500" : "bg-orange-500"}`}
            />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {room.status === "BETTING"
                ? `Đang đặt cược (${room.timer}s)`
                : room.status === "RESULT"
                  ? "Mở bát"
                  : "Chờ Nhà Cái"}
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <Coins className="text-orange-400" size={18} />
          </div>
          <div>
            <p className="text-white font-black">{balance.toLocaleString()}</p>
            <p className="text-[8px] text-gray-400 font-bold uppercase">
              Game Coins
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 relative z-10 items-stretch">
        {/* Player List (Left) */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <UserIcon size={14} />
            Người chơi ({room.players.length}/6)
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {room.players.map((p: any) => {
              const isMe = p.userId === (user?._id || user?.id)?.toString();
              const p_isDealer = p.userId === room.dealerId;
              const canTransfer =
                isDealer && !p_isDealer && room.status === "IDLE";

              return (
                <div
                  key={p.userId}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${isMe ? "bg-orange-500/20 border-orange-500/30" : "bg-white/5 border-white/10"}`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden bg-gray-700">
                      {p.avatar ? (
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px]">
                          👤
                        </div>
                      )}
                    </div>
                    {p_isDealer && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border border-gray-900">
                        <Crown size={8} className="text-gray-900" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-white truncate">
                        {p.name}
                      </p>
                      {canTransfer && (
                        <button
                          onClick={() =>
                            socket?.emit("baucua:transfer_dealer", {
                              roomId: room.id,
                              targetUserId: p.userId,
                            })
                          }
                          className="text-[8px] bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded-md font-black uppercase transition-colors"
                        >
                          Làm Cái
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] text-orange-400 font-black">
                      {p.gameCoins.toLocaleString()} xu
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Board (Center Area - Horizontal Flex) */}
        <div className="lg:col-span-4 flex flex-col lg:flex-row items-stretch gap-6">
          {/* Left Side: Plate & Bowl Area */}
          <div className="lg:w-[42%] flex flex-col gap-4">
            <div className="relative bg-[#cc0000] p-6 rounded-[3rem] shadow-2xl flex-1 flex flex-col items-center justify-center border-4 border-yellow-500/30 overflow-hidden">
              {/* Visual background patterns */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')]" />

              <div className="relative w-56 h-56 scale-90 sm:scale-100 mb-4">
                {/* Plate */}
                <div className="absolute inset-0 bg-gray-100 rounded-full border-[10px] border-gray-300 shadow-2xl overflow-hidden">
                  <div className="absolute inset-2 border-2 border-gray-400/20 rounded-full border-dashed" />
                  {(room.status === "RESULT" || bowlLifting) && (
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-4">
                      {lastResult.map((r, i) => (
                        <div
                          key={i}
                          className="w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center text-3xl animate-bounce-in"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        >
                          {SYMBOLS.find((s) => s.id === r)?.emoji}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bowl */}
                {(room.status === "BETTING" ||
                  isShaking ||
                  bowlLifting ||
                  room.status === "RESULT" ||
                  room.status === "IDLE") && (
                  <div
                    className={`absolute inset-0 z-30 transition-all duration-700 ease-in-out ${
                      bowlLifting || room.status === "RESULT"
                        ? "translate-y-[-115%] opacity-0 scale-125"
                        : "translate-y-[-5%]"
                    }`}
                  >
                    <div
                      className={`relative w-full h-full ${isShaking ? "animate-shake" : ""}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border-[10px] border-yellow-500 shadow-2xl flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')]" />

                        {/* Top Knob & Timer */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-20 h-20 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full border-4 border-yellow-500 shadow-xl flex items-center justify-center z-10">
                          {room.status === "BETTING" ? (
                            <p className="text-red-800 font-black text-2xl tracking-tighter">
                              00:
                              {room.timer < 10 ? `0${room.timer}` : room.timer}
                            </p>
                          ) : (
                            <div className="w-10 h-10 bg-yellow-400/50 rounded-full border-2 border-yellow-200 shadow-inner" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Overlaying Bottom */}
              <div className="relative z-40 w-full max-w-[200px] mt-4">
                {room.status === "IDLE" || room.status === "RESULT" ? (
                  isDealer ? (
                    <button
                      onClick={handleStartRound}
                      className="w-full py-3 bg-gradient-to-b from-yellow-300 to-orange-500 text-red-900 font-black text-sm rounded-full shadow-[0_8px_16px_rgba(249,115,22,0.3)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 group border-b-4 border-orange-800"
                    >
                      <RotateCcw className="group-hover:rotate-180 transition-transform duration-700 w-5 h-5" />
                      <span className="tracking-widest uppercase">
                        {room.status === "RESULT" ? "VÁN MỚI" : "BẮT ĐẦU"}
                      </span>
                    </button>
                  ) : (
                    <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 text-center animate-pulse">
                      <p className="text-yellow-400 font-bold uppercase tracking-widest text-[10px]">
                        {room.status === "RESULT"
                          ? "Chờ Nhà Cái lên ván mới..."
                          : "Chờ Nhà Cái xóc bát..."}
                      </p>
                    </div>
                  )
                ) : room.status === "BETTING" ? (
                  <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 text-center animate-pulse">
                    <p className="text-yellow-400 font-bold text-[10px] uppercase tracking-widest">
                      Đang nhận cược ({room.timer}s)
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right Side: Betting Grid & Chips */}
          <div className="lg:w-[58%] flex flex-col gap-4">
            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border-t-8 border-yellow-400 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-red-800 font-black text-lg flex items-center gap-2">
                  🏮 ĐẶT CƯỢC
                </h3>
              </div>

              {/* Symbols Grid */}
              <div className="grid grid-cols-3 gap-3">
                {SYMBOLS.map((symbol) => {
                  const totalBetOnSymbol =
                    room.bets
                      ?.filter((b: any) => b.mascot === symbol.id)
                      .reduce((sum: number, b: any) => sum + b.amount, 0) || 0;
                  const myBetOnSymbol =
                    room.bets
                      ?.filter(
                        (b: any) =>
                          b.userId === currentUserId && b.mascot === symbol.id,
                      )
                      .reduce((sum: number, b: any) => sum + b.amount, 0) || 0;

                  return (
                    <button
                      key={symbol.id}
                      onClick={() => handlePlaceBet(symbol.id)}
                      disabled={room.status !== "BETTING" || isDealer}
                      className={`group relative aspect-square sm:aspect-auto sm:h-28 rounded-2xl p-2 bg-white shadow-sm transition-all flex flex-col items-center justify-center border-[3px] ${
                        room.status === "BETTING" && !isDealer
                          ? "cursor-pointer hover:-translate-y-1 active:scale-95 border-gray-100 hover:border-orange-400"
                          : "cursor-default border-transparent"
                      }`}
                    >
                      {/* Result Indicator */}
                      {showResult && lastResult.includes(symbol.id) && (
                        <div className="absolute inset-0 bg-green-500/20 animate-pulse rounded-2xl" />
                      )}

                      <div className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform mb-1">
                        {symbol.emoji}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                        {symbol.label}
                      </span>

                      {/* Total Room Bets */}
                      {totalBetOnSymbol > 0 && (
                        <div className="absolute top-1 right-1 flex flex-col items-end gap-1">
                          <div className="bg-orange-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md">
                            Σ {totalBetOnSymbol.toLocaleString()}
                          </div>
                          {myBetOnSymbol > 0 && (
                            <div className="bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-bounce-in">
                              YOU: {myBetOnSymbol.toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Chips Selection Inside Card */}
              <div className="mt-6 bg-gray-50 rounded-2xl p-4">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
                  Tiền cược
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
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
                      selectedChip === balance && balance > 0
                        ? "bg-gradient-to-r from-orange-600 to-red-600 border-orange-700 text-white shadow-lg -translate-y-0.5 scale-105"
                        : "bg-white border-orange-200 text-orange-600 hover:border-orange-400"
                    }`}
                  >
                    🔥 ALL IN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History / Payouts (Right) */}
        <div className="lg:col-span-1">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Trophy size={14} />
            Lịch sử ván trước
          </h3>
          <div className="bg-black/30 rounded-3xl p-5 border border-white/5 min-h-[300px]">
            {lastResult.length > 0 ? (
              <div>
                <div className="flex justify-center gap-2 mb-6">
                  {lastResult.map((res, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 border-orange-500/50"
                    >
                      {SYMBOLS.find((s) => s.id === res)?.emoji}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase text-center mb-4">
                  Kết quả thanh toán
                </p>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                  {lastPayouts.length > 0 ? (
                    lastPayouts
                      .sort((a, b) => b.netDelta - a.netDelta)
                      .map((p, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center text-xs p-2 rounded-xl bg-white/5 border border-white/5"
                        >
                          <span className="text-gray-400 font-bold truncate max-w-[80px]">
                            {p.name}
                          </span>
                          <span
                            className={`font-black ${p.netDelta >= 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            {p.netDelta > 0 ? "+" : ""}
                            {p.netDelta.toLocaleString()}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-center text-gray-600 text-[10px] italic">
                      Không có ai đặt cược ván này
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-gray-600">
                <Timer size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Overlay Animation Removed */}
    </div>
  );
}
