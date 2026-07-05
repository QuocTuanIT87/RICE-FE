import { cn } from "@/lib/utils";

interface VipAvatarProps {
  avatarUrl?: string;
  name?: string;
  vipAvatarFrame?: string;
  hasMembership?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function VipAvatar({
  avatarUrl,
  name = "User",
  vipAvatarFrame = "none",
  hasMembership = false,
  size = "md",
  className,
}: VipAvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  const sizeClasses = {
    sm: "w-8 h-8 text-xs rounded-lg",
    md: "w-10 h-10 text-sm rounded-xl",
    lg: "w-16 h-16 text-lg rounded-2xl",
    xl: "w-24 h-24 text-3xl rounded-[28px]",
  };

  const framePadding = {
    sm: "p-0.5",
    md: "p-0.5",
    lg: "p-1",
    xl: "p-1.5",
  };

  const isVip = hasMembership && vipAvatarFrame && vipAvatarFrame !== "none";

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Outer Glow / Frame Wrapper */}
      <div
        className={cn(
          "relative overflow-hidden flex items-center justify-center bg-gray-100 shadow-sm",
          sizeClasses[size],
          isVip && framePadding[size],
          // Golden Crown frame border
          hasMembership &&
            vipAvatarFrame === "gold-crown" &&
            "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-amber-300/40",
          // Neon Ring frame border
          hasMembership &&
            vipAvatarFrame === "neon-ring" &&
            "bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 vip-frame-neon shadow-purple-300/40",
          // Diamond Sparkle frame border
          hasMembership &&
            vipAvatarFrame === "diamond" &&
            "bg-gradient-to-r from-blue-300 via-emerald-200 to-pink-300 vip-frame-sparkle shadow-blue-200/40",
          // Dragon Fire frame border
          hasMembership &&
            vipAvatarFrame === "dragon-fire" &&
            "bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 animate-pulse shadow-orange-550/40",
          // Angel Wings frame border
          hasMembership &&
            vipAvatarFrame === "angel-wings" &&
            "bg-gradient-to-r from-sky-200 via-white to-pink-200 shadow-sky-200/40",
          // Cat Ears frame border
          hasMembership &&
            vipAvatarFrame === "cat-ears" &&
            "bg-gradient-to-r from-pink-400 via-rose-350 to-pink-300 shadow-pink-300/40",
          // Aurora Nebula frame border
          hasMembership &&
            vipAvatarFrame === "aurora-nebula" &&
            "bg-gradient-to-tr from-teal-400 via-indigo-500 to-purple-600 animate-[pulse_3s_ease-in-out_infinite] shadow-teal-350/40",
          // Banana Dance frame border
          hasMembership &&
            vipAvatarFrame === "banana-dance" &&
            "bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-300 animate-bounce shadow-yellow-350/45",
          // Dark Skull frame border
          hasMembership &&
            vipAvatarFrame === "dark-skull" &&
            "bg-gradient-to-r from-zinc-800 via-slate-700 to-zinc-950 shadow-zinc-900/60",
          // Lucky Clover frame border
          hasMembership &&
            vipAvatarFrame === "lucky-clover" &&
            "bg-gradient-to-r from-green-300 via-emerald-400 to-teal-350 shadow-green-300/40",
          // Rainbow Unicorn frame border
          hasMembership &&
            vipAvatarFrame === "rainbow-unicorn" &&
            "bg-gradient-to-r from-red-400 via-yellow-400 via-blue-450 to-purple-500 shadow-pink-300/40 animate-pulse",
          // Winter Snow frame border
          hasMembership &&
            vipAvatarFrame === "winter-snow" &&
            "bg-gradient-to-r from-blue-200 via-cyan-100 to-blue-300 shadow-blue-200/40",
          // Nerd Glasses frame border
          hasMembership &&
            vipAvatarFrame === "nerd-glasses" &&
            "bg-gradient-to-r from-slate-400 via-gray-200 to-zinc-400 shadow-gray-300/30",
          // Alien UFO frame border
          hasMembership &&
            vipAvatarFrame === "alien-ufo" &&
            "bg-gradient-to-r from-lime-400 via-green-500 to-emerald-600 shadow-lime-400/40 animate-pulse",
          // Zombie Horde frame border
          hasMembership &&
            vipAvatarFrame === "zombie-horde" &&
            "bg-gradient-to-r from-green-800 via-stone-700 to-emerald-950 shadow-green-900/50",
          // Love Balloon frame border
          hasMembership &&
            vipAvatarFrame === "love-balloon" &&
            "bg-gradient-to-r from-pink-400 via-red-300 to-rose-450 shadow-red-200/40 animate-pulse",
          // Playful Crab frame border
          hasMembership &&
            vipAvatarFrame === "playful-crab" &&
            "bg-gradient-to-r from-red-400 via-rose-500 to-red-650 shadow-red-300/40",
          // Thunder Strike frame border
          hasMembership &&
            vipAvatarFrame === "thunder-strike" &&
            "bg-gradient-to-r from-yellow-300 via-indigo-600 to-purple-650 shadow-yellow-300/40",
          // Golden Money frame border
          hasMembership &&
            vipAvatarFrame === "golden-money" &&
            "bg-gradient-to-r from-amber-400 via-yellow-250 to-amber-500 shadow-yellow-200/40",
        )}
      >
        {/* Inner Avatar Container */}
        <div
          className={cn(
            "w-full h-full flex items-center justify-center overflow-hidden font-bold select-none",
            isVip ? "rounded-[inherit]" : "rounded-none",
            avatarUrl
              ? ""
              : "bg-gradient-to-br from-orange-400 to-red-500 text-white",
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>
      </div>

      {/* Decorative Overlays (only if membership is active) */}
      {hasMembership && (
        <>
          {/* Gold Crown - places a crown at the top-center */}
          {vipAvatarFrame === "gold-crown" && (
            <div
              className={cn(
                "absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow-md animate-bounce select-none pointer-events-none z-10",
                size === "sm" && "-top-2.5 text-xs",
                size === "md" && "-top-3.5 text-sm",
                size === "lg" && "-top-5 text-xl",
                size === "xl" && "-top-7.5 text-3xl",
              )}
            >
              👑
            </div>
          )}

          {/* Neon Ring Sparkle Particle (small dot) */}
          {vipAvatarFrame === "neon-ring" && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping z-10" />
          )}

          {/* Diamond - small sparkling crystal badge */}
          {vipAvatarFrame === "diamond" && (
            <div
              className={cn(
                "absolute -bottom-1 -right-1 leading-none drop-shadow-md select-none pointer-events-none z-10",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-sm",
                size === "xl" && "text-lg",
              )}
            >
              💎
            </div>
          )}

          {/* Dragon Fire - small flame badge */}
          {vipAvatarFrame === "dragon-fire" && (
            <div
              className={cn(
                "absolute -bottom-1 -right-1 leading-none drop-shadow-md select-none pointer-events-none z-10 animate-bounce",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-sm",
                size === "xl" && "text-lg",
              )}
            >
              🔥
            </div>
          )}

          {/* Angel Wings - wing badge on left and right sides */}
          {vipAvatarFrame === "angel-wings" && (
            <>
              <div
                className={cn(
                  "absolute -left-2.5 top-1/2 -translate-y-1/2 drop-shadow-sm select-none pointer-events-none z-10",
                  size === "sm" && "text-[10px] -left-2",
                  size === "md" && "text-xs -left-2.5",
                  size === "lg" && "text-base -left-4",
                  size === "xl" && "text-2xl -left-6",
                )}
              >
                🪽
              </div>
              <div
                className={cn(
                  "absolute -right-2.5 top-1/2 -translate-y-1/2 scale-x-[-1] drop-shadow-sm select-none pointer-events-none z-10",
                  size === "sm" && "text-[10px] -right-2",
                  size === "md" && "text-xs -right-2.5",
                  size === "lg" && "text-base -right-4",
                  size === "xl" && "text-2xl -right-6",
                )}
              >
                🪽
              </div>
            </>
          )}

          {/* Cat Ears - cat emoji at the top center */}
          {vipAvatarFrame === "cat-ears" && (
            <div
              className={cn(
                "absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow-md select-none pointer-events-none z-10",
                size === "sm" && "-top-2.5 text-xs",
                size === "md" && "-top-3 text-sm",
                size === "lg" && "-top-4.5 text-xl",
                size === "xl" && "-top-6.5 text-3xl",
              )}
            >
              🐱
            </div>
          )}

          {/* Aurora Nebula - glowing space star */}
          {vipAvatarFrame === "aurora-nebula" && (
            <div
              className={cn(
                "absolute -top-1 -right-1 leading-none drop-shadow-md select-none pointer-events-none z-10 animate-pulse",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-sm",
                size === "xl" && "text-lg",
              )}
            >
              ✨
            </div>
          )}

          {/* Banana Dance - dancing banana emoji */}
          {vipAvatarFrame === "banana-dance" && (
            <div
              className={cn(
                "absolute -bottom-1 -left-1 leading-none drop-shadow-md select-none pointer-events-none z-10 animate-[bounce_1.5s_infinite]",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-sm",
                size === "xl" && "text-lg",
              )}
            >
              🍌
            </div>
          )}

          {/* Dark Skull - dark skull emoji */}
          {vipAvatarFrame === "dark-skull" && (
            <div
              className={cn(
                "absolute -bottom-1 -right-1 leading-none drop-shadow-md select-none pointer-events-none z-10 animate-pulse",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-sm",
                size === "xl" && "text-lg",
              )}
            >
              💀
            </div>
          )}

          {/* Lucky Clover */}
          {vipAvatarFrame === "lucky-clover" && (
            <div
              className={cn(
                "absolute -bottom-1 -right-1 leading-none drop-shadow-md select-none pointer-events-none z-10",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-sm",
                size === "xl" && "text-lg",
              )}
            >
              🍀
            </div>
          )}

          {/* Rainbow Unicorn */}
          {vipAvatarFrame === "rainbow-unicorn" && (
            <div
              className={cn(
                "absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow-md select-none pointer-events-none z-10 animate-bounce",
                size === "sm" && "-top-2.5 text-xs",
                size === "md" && "-top-3.5 text-sm",
                size === "lg" && "-top-5 text-xl",
                size === "xl" && "-top-7.5 text-3xl",
              )}
            >
              🦄
            </div>
          )}

          {/* Winter Snow */}
          {vipAvatarFrame === "winter-snow" && (
            <div
              className={cn(
                "absolute -top-1 -right-1 leading-none drop-shadow-md select-none pointer-events-none z-10 animate-spin",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-sm",
                size === "xl" && "text-lg",
              )}
            >
              ❄️
            </div>
          )}

          {/* Nerd Glasses */}
          {vipAvatarFrame === "nerd-glasses" && (
            <div
              className={cn(
                "absolute -top-2.5 left-1/2 -translate-x-1/2 drop-shadow-md select-none pointer-events-none z-10",
                size === "sm" && "-top-2 text-xs",
                size === "md" && "-top-2.5 text-sm",
                size === "lg" && "-top-4 text-xl",
                size === "xl" && "-top-6 text-3xl",
              )}
            >
              🤓
            </div>
          )}

          {/* Alien UFO */}
          {vipAvatarFrame === "alien-ufo" && (
            <div
              className={cn(
                "absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow-md select-none pointer-events-none z-10 animate-pulse",
                size === "sm" && "-top-2 text-xs",
                size === "md" && "-top-2.5 text-sm",
                size === "lg" && "-top-4.5 text-xl",
                size === "xl" && "-top-6.5 text-3xl",
              )}
            >
              👽
            </div>
          )}

          {/* Zombie Horde */}
          {vipAvatarFrame === "zombie-horde" && (
            <div
              className={cn(
                "absolute -bottom-1 -left-1 leading-none drop-shadow-md select-none pointer-events-none z-10",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-sm",
                size === "xl" && "text-lg",
              )}
            >
              🧟
            </div>
          )}

          {/* Love Balloon */}
          {vipAvatarFrame === "love-balloon" && (
            <div
              className={cn(
                "absolute -top-2.5 -right-1 leading-none drop-shadow-md select-none pointer-events-none z-10 animate-[bounce_2s_infinite]",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-sm",
                size === "xl" && "text-lg",
              )}
            >
              🎈
            </div>
          )}

          {/* Playful Crab */}
          {vipAvatarFrame === "playful-crab" && (
            <div
              className={cn(
                "absolute -bottom-1 -right-1 leading-none drop-shadow-md select-none pointer-events-none z-10",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-sm",
                size === "xl" && "text-lg",
              )}
            >
              🦀
            </div>
          )}

          {/* Thunder Strike */}
          {vipAvatarFrame === "thunder-strike" && (
            <div
              className={cn(
                "absolute -top-1 -left-1 leading-none drop-shadow-md select-none pointer-events-none z-10 animate-pulse",
                size === "sm" && "text-[8px]",
                size === "md" && "text-[10px]",
                size === "lg" && "text-sm",
                size === "xl" && "text-lg",
              )}
            >
              ⚡
            </div>
          )}

          {/* Golden Money */}
          {vipAvatarFrame === "golden-money" && (
            <div
              className={cn(
                "absolute -bottom-1.5 -right-1.5 leading-none drop-shadow-md select-none pointer-events-none z-10 animate-bounce",
                size === "sm" && "text-[10px]",
                size === "md" && "text-xs",
                size === "lg" && "text-base",
                size === "xl" && "text-2xl",
              )}
            >
              💰
            </div>
          )}
        </>
      )}
    </div>
  );
}
