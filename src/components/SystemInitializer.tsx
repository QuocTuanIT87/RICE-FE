import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSystemConfig, setMaintenance } from "@/store/systemSlice";
import { systemApi } from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { logout } from "@/store/authSlice";

export default function SystemInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { socket } = useSocket();
  const { user } = useAppSelector((state) => state.auth);
  const { isMaintenance } = useAppSelector((state) => state.system);
  const prevMaintenanceRef = useRef<boolean | null>(null);

  // 1. Khi Admin tắt bảo trì thủ công qua Socket -> logout user
  useEffect(() => {
    if (prevMaintenanceRef.current === null) {
      prevMaintenanceRef.current = isMaintenance;
      return;
    }
    if (prevMaintenanceRef.current === true && isMaintenance === false && user?.role !== "admin") {
      dispatch(logout());
      window.location.href = "/login";
    }
    prevMaintenanceRef.current = isMaintenance;
  }, [isMaintenance, dispatch, user]);

  // 2. Fetch cấu hình hệ thống khi khởi tạo
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await systemApi.getConfig();
        if (response.data.data) {
          dispatch(setSystemConfig(response.data.data));
        }
      } catch (error) {
        console.error("Lỗi lấy cấu hình hệ thống:", error);
      }
    };
    fetchConfig();
  }, [dispatch]);

  // 3. Lắng nghe Socket events thời gian thực
  useEffect(() => {
    if (!socket) return;

    socket.on("system_config_updated", (config: any) => {
      dispatch(setSystemConfig(config));
    });

    socket.on("maintenance_status_changed", (data: any) => {
      dispatch(setMaintenance(data));
    });

    return () => {
      socket.off("system_config_updated");
      socket.off("maintenance_status_changed");
    };
  }, [socket, dispatch]);

  return <>{children}</>;
}
