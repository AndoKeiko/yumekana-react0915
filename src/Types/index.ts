export interface LoginForm {
  email: string;
  password: string;
}
export interface LoginResponse {
  token: string;
  user: User;
}
export interface LoginSuccessPayload {
  token: string;
  user: User;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface SortableItemProps {
  id: string | number;
  task: Task; // Task型の定義が必要です
  index: number;
  editingId: string | null;
  editedTask: Task | null;
  handleEdit: (task: Task) => void;
  handleSave: (id: string | number) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string) => void;
  handleDeleteTask: (id: string | number) => void;
}

export interface GoalItem {
  goalId: number;
  user_id: string;
  goal: string;
  currentSituation: string;
  targetPeriodStart: string;
  targetPeriodEnd: string;
}

export interface Task {
  id: number;
  userId: number;
  goalId: number;
  name: string;
  description: string | null;
  elapsedTime: number;
  estimatedTime: number;
  priority: number;
  order: number;
  reviewInterval: 'next_day' | '7_days' | '14_days' | '28_days' | '56_days' | 'completed';
  repetitionCount: number;
  lastNotificationSent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  name: string;
  nickname: string | null;
  email: string;
  password: string | null;
  user_id: string | null;
  avatar: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  current_status: string | null;
  period_start: string; // 'YYYY-MM-DD'形式
  period_end: string; // 'YYYY-MM-DD'形式
  description: string | null;
  status: number;
  total_time: number; 
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  goal_id: number;
  name: string;
  description: string | null;
  elapsed_time: number;
  estimated_time: number;
  priority: number;
  order: number;
  review_interval: 'next_day' | '7_days' | '14_days' | '28_days' | '56_days' | 'completed';
  repetition_count: number;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyHistory {
  id: number;
  user_id: number;
  task_id: number;
  date: string; // 'YYYY-MM-DD'形式
  study_time: number;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}