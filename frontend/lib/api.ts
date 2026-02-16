/**
 * API Client for Backend Communication
 *
 * Handles HTTP requests to the FastAPI backend.
 * Uses Better Auth session token for authentication.
 *
 * Note: Better Auth sets HttpOnly cookies that client-side JavaScript cannot read.
 * We proxy all API requests through /api/proxy which runs server-side and can
 * access the HttpOnly session cookies, then forwards them to the backend.
 */

const API_PROXY = "/api/proxy";
const isDev = process.env.NODE_ENV === "development";

// Direct backend URL (used only for health check which doesn't require auth)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Task type definitions matching the backend
export interface Task {
  id: number;
  user_id: string;
  parent_task_id?: number | null;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  tags: string[];
  due_date: string | null;
  recurrence_rule: string | null;
  reminder_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  completed?: boolean;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  due_date?: string;
  recurrence_rule?: string;
  reminder_at?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  due_date?: string;
  recurrence_rule?: string;
  reminder_at?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

// Notification type definitions
export interface Notification {
  id: number;
  user_id: string;
  task_id: number | null;
  type: string; // "due_date_reminder" | "task_completed" | "reminder"
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  count: number;
  display_count: string;
}


/**
 * Make an authenticated API request to the backend
 *
 * Uses the proxy route which can access HttpOnly cookies server-side.
 * The proxy forwards the request to the backend with proper authentication.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(API_PROXY + endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.status}`;
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content responses (e.g., delete operations)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============================================================================
// Task API Methods
// ============================================================================

export const tasksApi = {
  /**
   * Get all tasks for the current user
   */
  async list(params?: {
    completed?: boolean;
    priority?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    filter_start?: string;
    filter_end?: string;
    preset_filter?: string;
  }): Promise<TaskListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.completed !== undefined) {
      searchParams.set("completed", String(params.completed));
    }
    if (params?.priority) {
      searchParams.set("priority", params.priority);
    }
    if (params?.search) {
      searchParams.set("search", params.search);
    }
    if (params?.sort_by) {
      searchParams.set("sort_by", params.sort_by);
    }
    if (params?.sort_order) {
      searchParams.set("sort_order", params.sort_order);
    }
    if (params?.filter_start) {
      searchParams.set("filter_start", params.filter_start);
    }
    if (params?.filter_end) {
      searchParams.set("filter_end", params.filter_end);
    }
    if (params?.preset_filter) {
      searchParams.set("preset_filter", params.preset_filter);
    }

    const query = searchParams.toString();
    return apiRequest<TaskListResponse>(`/api/tasks${query ? `?${query}` : ""}`);
  },

  /**
   * Get a single task by ID
   */
  async get(taskId: number): Promise<Task> {
    return apiRequest<Task>(`/api/tasks/${taskId}`);
  },

  /**
   * Create a new task
   */
  async create(task: TaskCreate): Promise<Task> {
    return apiRequest<Task>(`/api/tasks`, {
      method: "POST",
      body: JSON.stringify(task),
    });
  },

  /**
   * Update an existing task (PUT for edit mode)
   */
  async put(taskId: number, task: TaskUpdate): Promise<Task> {
    return apiRequest<Task>(`/api/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(task),
    });
  },

  /**
   * Update an existing task (PATCH for partial updates)
   */
  async update(taskId: number, task: TaskUpdate): Promise<Task> {
    return apiRequest<Task>(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(task),
    });
  },

  /**
   * Delete a task
   */
  async delete(taskId: number): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });
  },

  /**
   * Mark a task as completed
   */
  async complete(taskId: number, editScope: "this" | "all" = "this"): Promise<Task> {
    return apiRequest<Task>(`/api/tasks/${taskId}/complete`, {
      method: "POST",
      body: JSON.stringify({ edit_scope: editScope }),
    });
  },

  /**
   * Mark a task as incomplete (reopen)
   */
  async uncomplete(taskId: number): Promise<Task> {
    return apiRequest<Task>(`/api/tasks/${taskId}/uncomplete`, {
      method: "POST",
    });
  },
};

// ============================================================================
// Notification API Methods
// ============================================================================

export const notificationsApi = {
  /**
   * Get all notifications for the current user
   */
  async list(params?: {
    unread_only?: boolean;
    limit?: number;
  }): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.unread_only) {
      searchParams.set("unread_only", "true");
    }
    if (params?.limit) {
      searchParams.set("limit", String(params.limit));
    }

    const query = searchParams.toString();
    return apiRequest<NotificationListResponse>(`/api/notifications${query ? `?${query}` : ""}`);
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiRequest<UnreadCountResponse>("/api/notifications/unread-count");
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<Notification> {
    return apiRequest<Notification>(`/api/notifications/${notificationId}`, {
      method: "PATCH",
      body: JSON.stringify({ read: true }),
    });
  },

  /**
   * Dismiss/delete a notification
   */
  async dismiss(notificationId: number): Promise<void> {
    return apiRequest<void>(`/api/notifications/${notificationId}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Health Check
// ============================================================================

export const healthApi = {
  async check(): Promise<{ status: string; timestamp?: string }> {
    const response = await fetch(`${API_URL}/health`, {
      credentials: "include",
    });
    return response.json();
  },
};
