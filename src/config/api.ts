const BASE_URL = "http://localhost/api";

// API Endpoints
export const API_ENDPOINTS = {
  // 認証関連
  GOOGLE_AUTH: `${BASE_URL}/auth/google`,
  GOOGLE_AUTH_CALLBACK: `${BASE_URL}/auth/google/callback`,
  REGISTER: `${BASE_URL}/register`,
  LOGOUT: `${BASE_URL}/logout`,
  LOGIN: `${BASE_URL}/login`,
  CSRF_COOKIE: `http://localhost/sanctum/csrf-cookie`,

  // ユーザー関連
  USER: `${BASE_URL}/user`,
  CURRENT_USER: `${BASE_URL}/user/me`,
  CREATE_USER: `${BASE_URL}/users`,
  UPDATE_USER: (userId: number) => `${BASE_URL}/users/${userId}`,
  RESET_PASSWORD: `${BASE_URL}/password/reset`,

  // 目標関連
  GOALS: `${BASE_URL}/goals`,
  USER_GOALS: (userId: number) => `${BASE_URL}/goals/user/${userId}`,
  CREATE_GOAL: `${BASE_URL}/goals`,
  DELETE_GOAL: (goalId: number) => `${BASE_URL}/goals/${goalId}`,
  UPDATE_GOAL: (goalId: number) => `${BASE_URL}/goals/${goalId}`,
  GOAL_DETAIL: (goalId: number) => `${BASE_URL}/goals/${goalId}`,
  CHAT_GOAL: (goalId: number) => `${BASE_URL}/goals/${goalId}/chat`,
  CHAT_HISTORY: (goalId: number) => `${BASE_URL}/goals/${goalId}/chat-history`,

  // タスク関連
  GOAL_TASKS: (goalId: number) => `${BASE_URL}/goals/${goalId}/tasks`,
  SAVE_TASKS: (goalId: number) => `${BASE_URL}/goals/${goalId}/tasks/save`,
  CREATE_TASK: (goalId: number) => `${BASE_URL}/goals/${goalId}/tasks`,
  UPDATE_TASK_ORDER: (goalId: number) => `${BASE_URL}/goals/${goalId}/tasks/order`,
  DELETE_TASK: (goalId: number, taskId: number) => `${BASE_URL}/goals/${goalId}/tasks/${taskId}`,
  UPDATE_TASK: (goalId: number, taskId: number) => `${BASE_URL}/goals/${goalId}/tasks/${taskId}`,
  UPDATE_ELAPSED_TIME: (goalId: number, taskId: number) => `${BASE_URL}/goals/${goalId}/tasks/${taskId}/elapsed-time`,
  UPDATE_REVIEW_INTERVAL: (goalId: number, taskId: number) => `${BASE_URL}/goals/${goalId}/tasks/${taskId}/review-interval`,
};

export default BASE_URL;