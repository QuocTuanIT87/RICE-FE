import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SystemState {
  isMaintenance: boolean;
  maintenanceStart: string | null;
  maintenanceEnd: string | null;
  maintenanceMessage: string | null;
  config: any | null;
  isLoading: boolean;
}

const initialState: SystemState = {
  isMaintenance: false,
  maintenanceStart: null,
  maintenanceEnd: null,
  maintenanceMessage: null,
  config: null,
  isLoading: true,
};

const systemSlice = createSlice({
  name: "system",
  initialState,
  reducers: {
    setMaintenance: (
      state,
      action: PayloadAction<{
        isMaintenance: boolean;
        maintenanceStart?: string | null;
        maintenanceEnd?: string | null;
        message?: string | null;
      }>
    ) => {
      state.isMaintenance = action.payload.isMaintenance;
      state.maintenanceStart = action.payload.maintenanceStart || null;
      state.maintenanceEnd = action.payload.maintenanceEnd || null;
      state.maintenanceMessage = action.payload.message || null;
    },
    setSystemConfig: (state, action: PayloadAction<any>) => {
      state.config = action.payload;
      state.isMaintenance = action.payload.isMaintenance;
      state.maintenanceStart = action.payload.maintenanceStart;
      state.maintenanceEnd = action.payload.maintenanceEnd;
      state.maintenanceMessage = action.payload.maintenanceMessage;
      state.isLoading = false;
    },
    setSystemLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setMaintenance, setSystemConfig, setSystemLoading } = systemSlice.actions;
export default systemSlice.reducer;
