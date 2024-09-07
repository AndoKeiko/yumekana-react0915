import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
  error: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  userId: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',  // 'user'と重複しない単一の名前
  initialState,
  reducers: {
    // ユーザーIDを設定するアクション
    setUserId: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.userId = action.payload;
      }
      state.userId = action.payload;
    },
    // ユーザーIDをクリアするアクション
    clearUserId: (state) => {
      if (state.user) {
        state.user.userId = null;
      }
    },
    // ユーザー情報を設定するアクション
    setUser: (state, action: PayloadAction<{ userId: string }>) => {
      state.user = action.payload;
    },
    clearUserId: (state) => {
      state.userId = null;
    },
    // ログイン処理の開始アクション
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    // 認証状態を設定するアクション
    setAuth: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    // ログイン成功時のアクション
    loginSuccess: (state, action: PayloadAction<{ userId: string }>) => {
      state.user = { userId: action.payload.userId };
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    // ログイン失敗時のアクション
    loginFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    // ログアウト処理
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },
  },
});

// エクスポートするアクション
export const { setUserId, setUser, loginStart, setAuth, loginSuccess, loginFailure, logout, clearUserId } = authSlice.actions;

// デフォルトエクスポートとしてリデューサーをエクスポート
export default authSlice.reducer;