import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/services/api";
import { TransparentImage } from "@/components/TransparentImage";
import { swalAlert } from "@/utils/swal";
import { cn } from "@/lib/utils";

// Play alert helpers to be reused
export const playSiuuu = () => {
  swalAlert({
    title: "🔥 SIUUUUUUUUUUUUUUUUUUUUUU!!! 🐐",
    text: "Anh Bảy ăn mừng SIUUU cuồng nhiệt!",
    icon: "success",
    timer: 5000,
  });
};

export const playWorldCup = () => {
  swalAlert({
    title: "🏆 WORLD CUP ĐÃ VỀ VỚI ANH BẢY!!! 🇵🇹",
    text: "Chiếc cúp vô địch thế giới vĩ đại trong tay nhà vua Cristiano Ronaldo!",
    icon: "success",
    timer: 5000,
  });
};

export const playMessiLeft = () => {
  swalAlert({
    title: "✨ ANKARA MESSI ANKARA MESSI ANKARA MESSI! 🇦🇷",
    text: "Anh Mười đi bóng xiếc ảo ghi bàn siêu phẩm và chỉ tay lên bầu trời cảm tạ tổ tiên!",
    icon: "success",
    timer: 5000,
  });
};

export const playMessiRight = () => {
  swalAlert({
    title: "🏆 CHIẾC CÚP VÀNG THẾ GIỚI CỦA KING LEO!!! 👑",
    text: "Giấc mơ vĩ đại nhất lịch sử túc cầu đã hoàn thành. Messi nâng cao cúp vàng World Cup cùng Argentina!",
    icon: "success",
    timer: 5000,
  });
};

export const playNeymarLeft = () => {
  swalAlert({
    title: "🤙 SHAKA SHAKA! DANCE SAMBA THÔI NÀO! 🇧🇷",
    text: "Neymar Jr kiến tạo điệu nghệ, nhăn mặt thè lưỡi ăn mừng ngẫu hứng phong cách đường phố!",
    icon: "success",
    timer: 5000,
  });
};

export const playNeymarRight = () => {
  swalAlert({
    title: "🕺 VŨ ĐIỆU SAMBA BẤT DIỆT! 🇧🇷",
    text: "Tiểu Neymar biểu diễn kỹ thuật gắp bóng đỉnh cao và nhún nhảy ăn mừng chiến thắng!",
    icon: "success",
    timer: 5000,
  });
};

// Mascot Float configuration helper
export const getMascotFloatConfig = (vipMascot: string) => {
  switch (vipMascot) {
    case "messi":
      return {
        leftSrc: "/messi_left.png",
        leftAlt: "Lionel Messi Argentina Left",
        leftTitle: "Bấm để xem anh Mười đi bóng Ankara Messi! 🐐",
        leftClick: playMessiLeft,
        leftHeightClass: "h-[340px] 2xl:h-[460px]",
        rightSrc: "/messi_right.png",
        rightAlt: "Lionel Messi Argentina Right",
        rightTitle: "Bấm để cùng anh Mười nâng cúp vàng! 🏆",
        rightClick: playMessiRight,
        rightHeightClass: "h-[340px] 2xl:h-[480px]",
      };
    case "neymar":
      return {
        leftSrc: "/neymar_left.png",
        leftAlt: "Neymar Jr Brazil Left",
        leftTitle: "Bấm để nhảy Samba cùng Neymar Jr! 🤙",
        leftClick: playNeymarLeft,
        leftHeightClass: "h-[340px] 2xl:h-[450px]",
        rightSrc: "/neymar_right.png",
        rightAlt: "Neymar Jr Brazil Right",
        rightTitle: "Bấm để chiêm ngưỡng vũ điệu Samba! 🕺",
        rightClick: playNeymarRight,
        rightHeightClass: "h-[340px] 2xl:h-[470px]",
      };
    case "ronaldo":
    default:
      return {
        leftSrc: "/ronaldo_left.png",
        leftAlt: "Cristiano Ronaldo Portugal Left",
        leftTitle: "Bấm để cùng anh Bảy SIUUUUUUU! 🇵🇹",
        leftClick: playSiuuu,
        leftHeightClass: "h-[340px] 2xl:h-[460px]",
        rightSrc: "/ronaldo_right.png",
        rightAlt: "Cristiano Ronaldo Portugal Right",
        rightTitle: "Bấm để cùng anh Bảy ăn mừng World Cup! 🏆",
        rightClick: playWorldCup,
        rightHeightClass: "h-[340px] 2xl:h-[510px]",
      };
  }
};

// Mascot Advice Card configuration helper
export const getMascotCardConfig = (vipMascot: string) => {
  switch (vipMascot) {
    case "messi":
      return {
        title: "Lời Khuyên của anh Mười 🇦🇷",
        message: `"Hãy ăn uống đầy đủ dinh dưỡng để kiến tạo những bước chạy thần sầu nhé đạo hữu! Ankara Messi!"`,
        containerClass: "bg-sky-50 border-sky-100 dark:bg-sky-950/20 dark:border-sky-900/30",
        titleClass: "text-sky-800 dark:text-sky-400",
        textClass: "text-sky-600 dark:text-sky-300",
        avatar: "/messi_left.png",
        clickAction: playMessiLeft,
      };
    case "neymar":
      return {
        title: "Lời Khuyên của anh Neymar 🇧🇷",
        message: `"Lên nhạc là nhảy, lên đơn là ăn! Hãy nạp đủ năng lượng để cùng quẩy Samba nhé đạo hữu! Shaka!"`,
        containerClass: "bg-amber-50 border-yellow-200 dark:bg-amber-950/20 dark:border-yellow-900/30",
        titleClass: "text-amber-800 dark:text-amber-400",
        textClass: "text-amber-600 dark:text-amber-300",
        avatar: "/neymar_left.png",
        clickAction: playNeymarLeft,
      };
    case "ronaldo":
    default:
      return {
        title: "Lời Khuyên của anh Bảy 🇵🇹",
        message: `"Có thực mới vực được đạo". Ăn đúng giờ để tu vi tinh tiến nhé đạo hữu!`,
        containerClass: "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30",
        titleClass: "text-emerald-800 dark:text-emerald-400",
        textClass: "text-emerald-600 dark:text-emerald-300",
        avatar: "/ronaldo_left.png",
        clickAction: playSiuuu,
      };
  }
};

// 1. Floating Screen Mascots for Layout
export default function VipMascots() {
  const { data: profileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => authApi.getMe(),
  });

  const user = profileData?.data.data;
  if (!user || !user.hasMembership) return null;

  const vipMascot = user.vipCosmetics?.vipMascot || "ronaldo";
  const mascotFloat = getMascotFloatConfig(vipMascot);

  return (
    <>
      <div
        className={cn(
          "hidden xl:block fixed left-[-30px] 2xl:left-[-60px] bottom-0 z-0 transition-all duration-500 hover:scale-110 active:scale-95 cursor-pointer select-none",
          mascotFloat.leftHeightClass
        )}
        onClick={mascotFloat.leftClick}
        title={mascotFloat.leftTitle}
      >
        <TransparentImage
          src={mascotFloat.leftSrc}
          alt={mascotFloat.leftAlt}
          className="h-full w-auto pointer-events-none filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
        />
      </div>

      <div
        className={cn(
          "hidden xl:block fixed right-[-30px] 2xl:right-[-60px] bottom-0 z-0 transition-all duration-500 hover:scale-110 active:scale-95 cursor-pointer select-none",
          mascotFloat.rightHeightClass
        )}
        onClick={mascotFloat.rightClick}
        title={mascotFloat.rightTitle}
      >
        <TransparentImage
          src={mascotFloat.rightSrc}
          alt={mascotFloat.rightAlt}
          className="h-full w-auto pointer-events-none filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
        />
      </div>
    </>
  );
}

// 2. Inline Card Mascot (speech bubble style)
export function VipMascotInline({ className }: { className?: string }) {
  const { data: profileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => authApi.getMe(),
  });

  const user = profileData?.data.data;
  if (!user || !user.hasMembership) return null;

  const vipMascot = user.vipCosmetics?.vipMascot || "ronaldo";
  const mascotConfig = getMascotCardConfig(vipMascot);

  return (
    <div
      onClick={mascotConfig.clickAction}
      className={cn(
        "p-4 rounded-3xl border shadow-md flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-98 cursor-pointer select-none overflow-hidden",
        mascotConfig.containerClass,
        className
      )}
      title="Bấm để tương tác với thần tượng!"
    >
      <div className="w-14 h-14 relative shrink-0 rounded-2xl overflow-hidden bg-white/50 border border-gray-100 flex items-center justify-center p-1">
        <TransparentImage
          src={mascotConfig.avatar}
          alt={mascotConfig.title}
          className="h-full w-auto object-contain"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={cn("font-black text-xs italic flex items-center gap-1.5", mascotConfig.titleClass)}>
          <span>{mascotConfig.title}</span>
          <span className="animate-bounce">💬</span>
        </h4>
        <p className={cn("text-[10px] font-bold mt-1 leading-relaxed line-clamp-2", mascotConfig.textClass)}>
          {mascotConfig.message}
        </p>
      </div>
    </div>
  );
}
