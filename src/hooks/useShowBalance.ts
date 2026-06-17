import { useState, useEffect } from "react";

export function useShowBalance() {
  const [showBalance, setShowBalanceState] = useState<boolean>(() => {
    const saved = localStorage.getItem("showBalance");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem("showBalance");
      if (saved !== null) {
        try {
          setShowBalanceState(JSON.parse(saved));
        } catch (e) {
          // ignore parsing error
        }
      }
    };

    window.addEventListener("balanceVisibilityChanged", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("balanceVisibilityChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const setShowBalance = (value: boolean | ((prev: boolean) => boolean)) => {
    setShowBalanceState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      localStorage.setItem("showBalance", JSON.stringify(next));
      window.dispatchEvent(new Event("balanceVisibilityChanged"));
      return next;
    });
  };

  return [showBalance, setShowBalance] as const;
}
