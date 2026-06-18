import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface UIState {
  sidebarOpen: boolean;
  notifications: Notification[];
  globalLoading: boolean;
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    onConfirmAction?: string;
    data?: unknown;
  };
}

const initialState: UIState = {
  sidebarOpen: true,
  notifications: [],
  globalLoading: false,
  confirmDialog: { open: false, title: '', message: '' },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    addNotification(state, action: PayloadAction<Omit<Notification, 'id'>>) {
      state.notifications.push({ ...action.payload, id: Date.now().toString() });
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.globalLoading = action.payload;
    },
    openConfirmDialog(state, action: PayloadAction<Omit<UIState['confirmDialog'], 'open'>>) {
      state.confirmDialog = { ...action.payload, open: true };
    },
    closeConfirmDialog(state) {
      state.confirmDialog = { open: false, title: '', message: '' };
    },
  },
});

export const {
  toggleSidebar, setSidebarOpen, addNotification, removeNotification,
  setGlobalLoading, openConfirmDialog, closeConfirmDialog,
} = uiSlice.actions;
export default uiSlice.reducer;
