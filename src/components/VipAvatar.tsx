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
          hasMembership && vipAvatarFrame === "gold-crown" && "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-amber-300/40",
          // Neon Ring frame border
          hasMembership && vipAvatarFrame === "neon-ring" && "bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 vip-frame-neon shadow-purple-300/40",
          // Diamond Sparkle frame border
          hasMembership && vipAvatarFrame === "diamond" && "bg-gradient-to-r from-blue-300 via-emerald-200 to-pink-300 vip-frame-sparkle shadow-blue-200/40"
        )}
      >
        {/* Inner Avatar Container */}
        <div
          className={cn(
            "w-full h-full flex items-center justify-center overflow-hidden font-bold select-none",
            isVip ? "rounded-[inherit]" : "rounded-none",
            avatarUrl ? "" : "bg-gradient-to-br from-orange-400 to-red-500 text-white"
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
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
            <div className={cn(
              "absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow-md animate-bounce select-none pointer-events-none z-10",
              size === "sm" && "-top-2.5 text-xs",
              size === "md" && "-top-3.5 text-sm",
              size === "lg" && "-top-5 text-xl",
              size === "xl" && "-top-7.5 text-3xl"
            )}>
              👑
            </div>
          )}

          {/* Neon Ring Sparkle Particle (small dot) */}
          {vipAvatarFrame === "neon-ring" && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping z-10" />
          )}

          {/* Diamond - small sparkling crystal badge */}
          {vipAvatarFrame === "diamond" && (
            <div className={cn(
              "absolute -bottom-1 -right-1 leading-none drop-shadow-md select-none pointer-events-none z-10",
              size === "sm" && "text-[8px]",
              size === "md" && "text-[10px]",
              size === "lg" && "text-sm",
              size === "xl" && "text-lg"
            )}>
              💎
            </div>
          )}
        </>
      )}
    </div>
  );
}
