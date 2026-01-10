/**
 * API Client for Backend Communication
 *
 * Handles HTTP requests to the FastAPI backend with JWT token authentication.
 * Uses Better Auth's JWT client for token management.
 */

import { getAuthToken } from "./auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const isDev = process.env.NODE_ENV === "development";

// Task type definitions matching the backend
export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  tags: string[];
  due_date: string | null;
  recurrence_rule: string | null;
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
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  due_date?: string;
  recurrence_rule?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}


/**
 * Make an authenticated API request to the backend
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (isDev) {
    console.warn("No auth token available");
  }

  if (isDev) {
    console.log(`API Request: ${options.method || "GET"} ${API_URL}${endpoint}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (isDev) {
      console.error(`API Error: ${response.status} - ${errorText}`);
    }
    let errorMessage = `API Error: ${response.status}`;
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
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
   * Update an existing task
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
  async complete(taskId: number): Promise<Task> {
    return apiRequest<Task>(`/api/tasks/${taskId}/complete`, {
      method: "POST",
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
// Health Check
// ============================================================================

export const healthApi = {
  async check(): Promise<{ status: string; timestamp?: string }> {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  },
};
