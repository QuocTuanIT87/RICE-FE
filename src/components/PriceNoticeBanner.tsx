import { useState, useEffect } from "react";
import { X, AlertTriangle, TrendingUp } from "lucide-react";

const STORAGE_KEY = "price_notice_dismissed_date";

export default function PriceNoticeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const dismissedDate = localStorage.getItem(STORAGE_KEY);

    if (dismissedDate !== today) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(STORAGE_KEY, today);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay mờ */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
        onClick={handleDismiss}
      />

      {/* Banner chính */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 animate-in zoom-in-95 fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-orange-200">
          {/* Header gradient */}
          <div className="bg-orange-500 p-7 text-white relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  📢 Thông báo quan trọng
                </h2>
                <p className="text-orange-100 text-sm font-semibold mt-1">
                  Cập nhật chính sách giá dịch vụ
                </p>
              </div>
            </div>
          </div>

          {/* Nội dung */}
          <div className="p-7 space-y-5">
            <div className="flex items-start gap-4 p-5 bg-orange-50 rounded-2xl border border-orange-100">
              <TrendingUp className="text-orange-500 shrink-0 mt-1" size={28} />
              <div className="space-y-3">
                <p className="text-base text-gray-700 leading-relaxed">
                  Kính gửi quý khách hàng,
                </p>
                <p className="text-base text-gray-700 leading-relaxed">
                  Do{" "}
                  <strong className="text-orange-600">vật giá leo thang</strong>{" "}
                  và{" "}
                  <strong className="text-orange-600">
                    chi phí duy trì server
                  </strong>{" "}
                  ngày càng tăng cao, chúng tôi rất tiếc phải thông báo{" "}
                  <strong className="text-red-600 text-lg">
                    điều chỉnh tăng giá nhè nhẹ
                  </strong>{" "}
                  các gói lượt đặt cơm.
                </p>
                <p className="text-base text-gray-600 leading-relaxed">
                  Mong quý khách hàng thông cảm và tiếp tục đồng hành cùng chúng
                  tôi. Xin chân thành cảm ơn! 🙏
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-base tracking-wide transition-colors shadow-lg shadow-orange-200 uppercase"
            >
              ✅ Tôi đã hiểu
            </button>

            <p className="text-center text-xs text-gray-400 font-medium">
              Thông báo này chỉ hiện 1 lần mỗi ngày
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
