import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";

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
  const { user, token } = useAppSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!token || !user) {
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
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("🔌 Connected to Socket.io server");
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

    newSocket.on("disconnect", () => {
      console.log("🔌 Disconnected from Socket.io server");
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.role, user?.id, user?._id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
