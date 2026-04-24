import { useAppSelector } from "@/store/hooks";
import { Clock, Hammer, ShieldAlert } from "lucide-react";
import React, { useEffect, useState } from "react";

const MaintenancePage: React.FC = () => {
  const { maintenanceEnd, maintenanceMessage } = useAppSelector(
    (state) => state.system,
  );
  const [timeLeft, setTimeLeft] = useState<{
    d: number;
    h: number;
    m: number;
    s: number;
  } | null>(null);

  useEffect(() => {
    if (!maintenanceEnd) return;

    const targetDate = new Date(maintenanceEnd).getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        window.location.reload(); // Tự động reload khi hết giờ
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [maintenanceEnd]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-10 animate-in fade-in zoom-in duration-700">
        {/* Icon Header */}
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-500/20 rotate-3 animate-bounce-slow">
            <Hammer size={48} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-slate-900 border-2 border-orange-500/50 rounded-full flex items-center justify-center animate-spin-slow">
            <Clock size={20} className="text-orange-500" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
            Hệ thống <span className="text-orange-500">Bảo trì</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed max-w-lg mx-auto">
            {maintenanceMessage ||
              "Chúng tôi đang nâng cấp hệ thống để mang lại trải nghiệm tốt nhất cho đạo hữu."}
          </p>
        </div>

        {/* Countdown Timer */}
        {timeLeft && (
          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
            {[
              { label: "Ngày", value: timeLeft.d },
              { label: "Giờ", value: timeLeft.h },
              { label: "Phút", value: timeLeft.m },
              { label: "Giây", value: timeLeft.s },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-full aspect-square bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-2 backdrop-blur-md">
                  <span className="text-2xl md:text-3xl font-black text-orange-500 tabular-nums">
                    {String(item.value).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-bold animate-pulse">
          <ShieldAlert size={18} />
          Mọi dữ liệu vẫn được bảo mật an toàn 100%
        </div>

        <p className="text-gray-600 text-[11px] font-bold uppercase tracking-[0.3em]">
          Powered by Minh Lao Ma
        </p>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(3deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `,
        }}
      />
    </div>
  );
};

export default MaintenancePage;
