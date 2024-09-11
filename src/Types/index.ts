export interface CsrfResponse {
  csrf_token: string;
}

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
  id: number;
  task: Task;
  editingId: string | null;
  editedTask: Task | null;
  handleEdit: (task: Task) => void;
  handleSave: (id: number) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string) => void;
  handleDeleteTask: (id: number) => void;
  index: number;
}


export interface TaskItem {
  id: number;
  name: string; // 追加
  TaskItem: string; // 追加
  taskPriority: string;
  time: string; // 追加
  priority: string; // 追加
}
export type UserType = {
  id: number;
  name: string;
  email: string;
  // 他のフィールド
};

export interface GoalItem {
  id: number; 
  name: string;
  period_start: string;
  period_end: string;
  user_id: string;
  goal: string;
  currentSituation: string;
  targetPeriodStart: string;
  targetPeriodEnd: string;
}

export interface GoalsListProps {
  user_id: string | null;
  goals: GoalItem[];
  onGoalSelect: (goal: GoalItem) => Promise<void>;
  onGoalDelete: (id: number) => Promise<void>;
  selectedGoal: GoalItem | null;
  serverError: string | null;
}

export interface GoalItem {
  goalId: number;
  userId: string;
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
  order: number;
  taskOrder?: number;
  reviewInterval: 'next_day' | '7_days' | '14_days' | '28_days' | '56_days' | 'completed';
  repetitionCount: number;
  lastNotificationSent: string | null;
  createdAt: string;
  updatedAt: string;
  taskTime?: number;
  taskName?: string;
  taskPriority?: number;
  priority?: number;
  estimated_time?: number;
}

export interface ScheduleProps {
  events: Array<{
    start: Date;
    end: Date;
    title: string;
  }>;
}
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  // 他のプロパティがあればここに追加
}
export type RegisterForm = {
  name: string;
  nickname: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export interface User {
  id: number;
  name: string;
  nickname: string | null;
  email: string;
  password: string | null;
  userId: string | null;
  avatar: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: number;
  userId: number;
  name: string;
  currentStatus: string | null;
  periodStart: string; // 'YYYY-MM-DD'形式
  periodEnd: string; // 'YYYY-MM-DD'形式
  description: string | null;
  status: number;
  totalTime: number;
  progressPercentage: number;
  created_at: string;
  updated_at: string;
  taskTime?: number; // ここに追加
  taskPriority?: number; // ここに追加
}



export interface DailyHistory {
  id: number;
  userId: number;
  taskId: number;
  date: string; // 'YYYY-MM-DD'形式
  studyTime: number;
  startTime: string;
  endTime: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
