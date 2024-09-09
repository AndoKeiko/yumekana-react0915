const BASE_URL = "http://localhost/api";

// API Endpoints
export const API_ENDPOINTS = {

  // Google認証のリダイレクトURL
  GOOGLE_AUTH: `${BASE_URL}/auth/google`,

  // Google認証のコールバックURL
  GOOGLE_AUTH_CALLBACK: `${BASE_URL}/auth/google/callback`,

  // ユーザー登録エンドポイント
  REGISTER: `${BASE_URL}/register`,

  // ログアウトエンドポイント
  LOGOUT: `${BASE_URL}/logout`,

  // ユーザー情報取得エンドポイント
  USER: `${BASE_URL}/user`,

  // CSRFトークン取得エンドポイント
  CSRF_COOKIE: `/sanctum/csrf-cookie`,

  // 新しいユーザーを登録するエンドポイント
  CREATE_USER: `${BASE_URL}/users`,

  // ユーザーのログインを行うエンドポイント
  LOGINURL: `${BASE_URL}/login`,

  //全ての目標を取得
  GOALS: `${BASE_URL}/goals`,

 // 特定のユーザーの全ての目標を取得するエンドポイント
  // @param {string} userId - ユーザーの Firebase UID
  USER_GOALS: (userId: string) => `${BASE_URL}/goals/user/${userId}`,
  
 // 新しい目標を作成するエンドポイント
  CREATE_GOAL: `${BASE_URL}/goals`,

  // 特定の目標を削除するエンドポイント
  // @param {number} goalId - 削除する目標のID
  DELETE_GOAL: (goalId: number) => `${BASE_URL}/goals/${goalId}`,

  // 特定の目標の詳細を取得するエンドポイント
  // @param {number} goalId - 詳細を取得する目標のID
  GOAL_DETAIL: (goalId: number) => `${BASE_URL}/goals/${goalId}`,

  // 特定の目標に対してチャットリクエストを送信するエンドポイント
  // @param {number} goalId - チャットする目標のID
  CHAT_GOAL: (goalId: number) => `${BASE_URL}/goals/${goalId}/chat`,

  // 特定の目標のチャット履歴を取得するエンドポイント
  // @param {number} goalId - チャット履歴を取得する目標のID
  CHAT_HISTORY: (goalId: number) => `${BASE_URL}/goals/${goalId}/chat-history`,

  // 特定の目標に関連するタスクを取得するエンドポイント
  // @param {number} goalId - タスクを取得する目標のID
  GOAL_TASKS: (goalId: number) => `${BASE_URL}/goals/${goalId}/tasks`,

  // 特定の目標に関連するタスクを保存するエンドポイント
  // @param {number} goalId - タスクを保存する目標のID
  SAVE_TASKS: (goalId: number) => `${BASE_URL}/goals/${goalId}/tasks/save`,

    // タスクを更新するエンドポイント
  // @param {number} taskId - 更新するタスクのID
  UPDATE_TASK: (taskId: number) => `${BASE_URL}/tasks/${taskId}`,

  DELETE_TASK: (taskId: number) => `${BASE_URL}/tasks/${taskId}`,
};

export default BASE_URL;