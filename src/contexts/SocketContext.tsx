import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store";
import { updateGameCoins } from "@/store/authSlice";
import { useQueryClient } from "@tanstack/react-query";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token, isAuthenticated } = useAppSelector(
    (state: RootState) => state.auth,
  );
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Chỉ connect khi đã xác thực (qua cookie hoặc token cũ)
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Lấy Base URL từ API URL (bỏ phần /api ở cuối nếu có)
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const socketUrl = apiUrl.replace(/\/api$/, "");

    const newSocket = io(socketUrl, {
      auth: {
        token: token, // Vẫn giữ token phòng hờ trường hợp dùng localStorage
      },
      withCredentials: true, // QUAN TRỌNG: Gửi kèm Cookie lên server
      // Polling trước, rồi upgrade lên websocket
      // Render free tier không hỗ trợ sticky sessions → websocket-first sẽ fail
      transports: ["polling", "websocket"],
      upgrade: true,
      // Timeout và reconnection config cho production
      timeout: 60000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on("connect", () => {
      console.log(
        "🔌 Connected to Socket.io server (transport:",
        newSocket.io.engine.transport.name,
        ")",
      );
      setIsConnected(true);

      // Tham gia phòng cá nhân
      const userId = user.id || user._id;
      if (userId) {
        newSocket.emit("join", userId);
        console.log(`🏠 Joined personal room: ${userId}`);
      }

      // Nếu là admin, tham gia phòng admin
      if (user.role === "admin") {
        newSocket.emit("join_admin");
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from Socket.io server, reason:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket.io connection error:", err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.role, user?.id, user?._id]);

  // ============================================
  // GLOBAL SOCKET LISTENERS
  // Invalidate React Query cache khi nhận socket events
  // Dù admin/user đang ở trang nào, cache sẽ bị invalidate
  // → khi navigate tới trang liên quan, data sẽ tự refetch
  // ============================================
  useEffect(() => {
    if (!socket) return;

    // --- Admin events: khi khách hàng thao tác ---
    socket.on("purchase_request_created", () => {
      queryClient.invalidateQueries({ queryKey: ["adminPurchaseRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    });

    socket.on("order_created", () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    });

    socket.on("order_updated", () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
    });

    // --- Customer events: khi admin thao tác ---
    socket.on("package_created", () => {
      queryClient.invalidateQueries({ queryKey: ["mealPackages"] });
    });

    socket.on("package_updated", () => {
      queryClient.invalidateQueries({ queryKey: ["mealPackages"] });
    });

    socket.on("package_deleted", () => {
      queryClient.invalidateQueries({ queryKey: ["mealPackages"] });
    });

    socket.on("purchase_request_approved", (data) => {
      queryClient.invalidateQueries({ queryKey: ["myPackages"] });
      queryClient.invalidateQueries({ queryKey: ["myActivePackages"] });
      queryClient.invalidateQueries({ queryKey: ["myPurchaseRequests"] });

      // Cập nhật xu ngay lập tức nếu có thông tin
      if (data?.gameCoins !== undefined) {
        dispatch(updateGameCoins(data.gameCoins));
      }
    });

    socket.on("purchase_request_rejected", () => {
      queryClient.invalidateQueries({ queryKey: ["myPurchaseRequests"] });
    });

    socket.on("coins_updated", (data) => {
      if (data?.gameCoins !== undefined) {
        dispatch(updateGameCoins(data.gameCoins));
      }
    });

    socket.on("order_confirmed", () => {
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
    });

    socket.on("menu_created", () => {
      queryClient.invalidateQueries({ queryKey: ["todayMenu"] });
      queryClient.invalidateQueries({ queryKey: ["dailyMenus"] });
    });

    socket.on("menu_updated", () => {
      queryClient.invalidateQueries({ queryKey: ["todayMenu"] });
      queryClient.invalidateQueries({ queryKey: ["dailyMenus"] });
    });

    socket.on("menu_locked", () => {
      queryClient.invalidateQueries({ queryKey: ["todayMenu"] });
      queryClient.invalidateQueries({ queryKey: ["dailyMenus"] });
    });

    socket.on("menu_unlocked", () => {
      queryClient.invalidateQueries({ queryKey: ["todayMenu"] });
      queryClient.invalidateQueries({ queryKey: ["dailyMenus"] });
    });

    return () => {
      socket.off("purchase_request_created");
      socket.off("order_created");
      socket.off("order_updated");
      socket.off("package_created");
      socket.off("package_updated");
      socket.off("package_deleted");
      socket.off("purchase_request_approved");
      socket.off("purchase_request_rejected");
      socket.off("coins_updated");
      socket.off("order_confirmed");
      socket.off("menu_created");
      socket.off("menu_updated");
      socket.off("menu_locked");
      socket.off("menu_unlocked");
    };
  }, [socket, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
