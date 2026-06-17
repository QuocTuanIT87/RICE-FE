import Swal from "sweetalert2";

const iconColorMap = {
  success: "#10b981", // Premium emerald green
  error: "#ef4444",   // Red/Rose
  warning: "#f59e0b", // Amber/Orange
  info: "#3b82f6",    // Blue
  question: "#8b5cf6", // Purple
};

export const swalAlert = ({
  title,
  text,
  icon,
  timer = 3000,
}: {
  title: string;
  text?: string;
  icon: "success" | "error" | "warning" | "info";
  timer?: number;
}) => {
  return Swal.fire({
    title,
    text,
    icon,
    iconColor: iconColorMap[icon],
    timer: timer || undefined,
    timerProgressBar: true,
    showConfirmButton: true,
    confirmButtonText: "ĐỒNG Ý",
    customClass: {
      popup: "rounded-3xl border border-gray-100 bg-white font-sans text-gray-900 shadow-2xl p-6 max-w-[416px] overflow-hidden",
      title: "text-base font-black text-slate-800 uppercase tracking-wide",
      htmlContainer: "text-sm font-semibold text-slate-500 mt-1.5 leading-relaxed",
      confirmButton: "px-6 py-3 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:opacity-90 text-white rounded-2xl font-black text-[13px] shadow-md uppercase tracking-wider transition-all focus:outline-none active:scale-95",
    },
    buttonsStyling: false,
  });
};

export const swalConfirm = ({
  title,
  text,
  confirmText = "XÁC NHẬN",
  cancelText = "HỦY BỎ",
  icon = "warning",
}: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: "success" | "error" | "warning" | "info" | "question";
}) => {
  return Swal.fire({
    title,
    text,
    icon,
    iconColor: iconColorMap[icon],
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    customClass: {
      popup: "rounded-3xl border border-gray-100 bg-white font-sans text-gray-900 shadow-2xl p-6 max-w-[416px]",
      title: "text-base font-black text-slate-800 uppercase tracking-wide",
      htmlContainer: "text-sm font-semibold text-slate-500 mt-1.5 leading-relaxed",
      confirmButton: "px-6 py-3 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:opacity-90 text-white rounded-2xl font-black text-[13px] shadow-md uppercase tracking-wider ml-2 transition-all focus:outline-none active:scale-95",
      cancelButton: "px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-slate-500 rounded-2xl font-black text-[13px] uppercase tracking-wider transition-all focus:outline-none active:scale-95",
    },
    buttonsStyling: false,
  });
};

export const swalToast = ({
  title,
  icon,
}: {
  title: string;
  icon: "success" | "error" | "warning" | "info";
}) => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
    iconColor: iconColorMap[icon],
    customClass: {
      popup: "rounded-2xl border border-gray-100 bg-white font-sans text-gray-900 shadow-lg p-3 max-w-[260px]",
      title: "text-xs font-bold text-gray-800",
    },
  });

  return Toast.fire({
    icon,
    title,
  });
};
