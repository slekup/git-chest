import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { Toast } from "@typings/core";

import { RootState } from "../store";
import crypto from "crypto";

const defaultToastSeconds = 10;
const initialState: Toast[] = [];

const history: Toast[] = [];

const toastsSlice = createSlice({
  name: "toasts",
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Toast>) => {
      const newToast = {
        id: crypto.randomBytes(20).toString("hex"),
        title: action.payload.title,
        description: action.payload.description,
        type: action.payload.type,
        time: action.payload.time || 1000 * defaultToastSeconds,
      };
      state.push(newToast);
      history.push(newToast);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      return state.filter((toast) => toast.id !== action.payload);
    },
    resetTime: (state, action: PayloadAction<string>) => {
      const toastIndex = state.findIndex(
        (toast) => toast.id === action.payload,
      );
      state[toastIndex].time = state[toastIndex].time
        ? state[toastIndex].time + 1
        : 1000 * defaultToastSeconds;
      return state;
    },
    getHistory: (_state) => {
      return history;
    },
    deleteHistory: (_state) => {
      history.length = 0;
    },
  },
});

export const { addToast, removeToast, resetTime } = toastsSlice.actions;

export const toastsState = (state: RootState) => state.toasts;

export default toastsSlice.reducer;
