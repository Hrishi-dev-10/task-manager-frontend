import type {
  Project,
  ProjectInput,
  ProjectUpdate,
  Task,
  TaskInput,
  TaskStatus,
  TaskOrderSubmission,
  TaskUpdate,
  WorkspaceUser,
} from "./types";

const API_BASE = import.meta.env.API ?? "http://localhost:5000/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

type ErrorBody = {
  message?: string;
  fields?: Record<string, string>;
  error?: { message?: string };
};

type StoredSession = {
  user?: { email?: string; id?: string };
  accessToken?: string;
  refreshToken?: string;
};

const SESSION_KEY = "taskmaster.session";

function readStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const session = readStoredSession();
  if (!session?.refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh-token`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
        if (!response.ok) return false;
        const body = (await response.json()) as {
          data?: { user?: StoredSession["user"]; accessToken?: string; refreshToken?: string };
        };
        const next = body.data;
        if (!next?.accessToken || !next.refreshToken) return false;
        writeStoredSession({
          user: next.user ?? session.user,
          accessToken: next.accessToken,
          refreshToken: next.refreshToken,
        });
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function authHeader(): Record<string, string> {
  const user = readStoredSession()?.user;
  const headers: Record<string, string> = {};
  if (user?.email) headers["X-User-Email"] = user.email;
  if (user?.id) headers["X-User-Id"] = user.id;
  return headers;
}

/** Access token is the Bearer token. Refresh token goes with the routes that require auth. */
function tokenHeader(): Record<string, string> {
  const session = readStoredSession();
  const headers: Record<string, string> = {};
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
  if (session?.refreshToken) headers["X-Refresh-Token"] = session.refreshToken;
  return headers;
}

type RequestOptions = RequestInit & { auth?: boolean };

async function request<T>(path: string, init?: RequestOptions, retried = false): Promise<T> {
  const { auth, headers, ...rest } = init ?? {};
  void auth;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...authHeader(),
        ...tokenHeader(),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => null)) as (T & ErrorBody) | null;
  if (response.status === 401 && !retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, init, true);
    sessionStorage.removeItem(SESSION_KEY);
    if (window.location.pathname !== "/login") window.location.assign("/login");
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.message || body?.error?.message || "The request could not be completed.",
      body?.fields ?? {},
    );
  }
  return body as T;
}

function json(body: unknown): RequestInit {
  return { body: JSON.stringify(body) };
}

function unwrapData<T>(body: T | { data: T } | null): T {
  if (body && typeof body === "object" && "data" in body) return body.data;
  return body as T;
}

type ApiTask = {
  id: string;
  title?: string;
  name?: string;
  description?: string | null;
  status?: string;
  position?: number;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  projectId?: string;
  projectName?: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assignedTo?: { id?: string | null; name?: string | null } | null;
};

function toApiStatus(status: TaskStatus | undefined) {
  switch (status) {
    case "in_progress":
      return "IN_PROGRESS";
    case "blocked":
      return "BLOCKED";
    case "in_review":
      return "IN_REVIEW";
    case "completed":
      return "COMPLETED";
    default:
      return "PENDING";
  }
}

function toTaskStatus(status: string | undefined): TaskStatus {
  switch (status?.toLowerCase()) {
    case "in_progress":
      return "in_progress";
    case "blocked":
      return "blocked";
    case "in_review":
      return "in_review";
    case "completed":
      return "completed";
    default:
      return "pending";
  }
}

function toTask(row: ApiTask, projectId?: string): Task {
  const assigneeId = row.assigneeId ?? row.assignedTo?.id ?? null;
  return {
    id: row.id,
    name: row.name ?? row.title ?? "",
    description: row.description ?? "",
    status: toTaskStatus(row.status),
    assigneeId,
    assigneeName: row.assigneeName ?? row.assignedTo?.name ?? null,
    projectId: row.projectId ?? projectId ?? "",
    projectName: row.projectName ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
    displayOrder: row.displayOrder ?? row.position ?? 0,
  };
}

export const api = {
  users: async () => {
    const body = await request<WorkspaceUser[] | { data: WorkspaceUser[] }>("/users");
    return Array.isArray(body) ? body : (body?.data ?? []);
  },

  updateUser: (id: string, input: { name: string; email: string }) => {
    const session = readStoredSession();
    return request(`/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      auth: true,
      ...json({
        name: input.name,
        email: input.email,
        token: session?.accessToken,
        refreshToken: session?.refreshToken,
      }),
    });
  },

  projects: async () => {
    const body = await request<Project[] | { data: Project[] }>("/projects");
    return Array.isArray(body) ? body : (body?.data ?? []);
  },

  project: async (id: string) => {
    const body = await request<Project | { data: Project }>(`/projects/${encodeURIComponent(id)}`);
    const project = unwrapData(body);
    return { ...project, members: project.members ?? [] };
  },

  createProject: (input: ProjectInput) =>
    request<Project>("/projects", { method: "POST", auth: true, ...json(input) }),

  updateProject: (id: string, input: ProjectUpdate) =>
    request<Project>(`/projects/${id}`, { method: "PATCH", auth: true, ...json(input) }),

  deleteProject: (id: string) =>
    request<void>(`/projects/${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),

  addProjectMember: async (projectId: string, userId: string) => {
    await request(
      `/projects/${encodeURIComponent(projectId)}/member/${encodeURIComponent(userId)}`,
      { method: "POST", auth: true },
    );
    return api.project(projectId);
  },

  removeProjectMember: async (projectId: string, userId: string) => {
    await request(
      `/projects/${encodeURIComponent(projectId)}/member/${encodeURIComponent(userId)}`,
      { method: "DELETE", auth: true },
    );
    return api.project(projectId);
  },

  tasks: async (projectId?: string) => {
    const body = await request<ApiTask[] | { data: ApiTask[] }>(
      projectId ? `/tasks?projectId=${encodeURIComponent(projectId)}` : "/tasks",
      { auth: true },
    );
    const rows = Array.isArray(body) ? body : (body?.data ?? []);
    return rows.map((row) => toTask(row, projectId));
  },

  createTask: (input: TaskInput) =>
    request<Task>("/tasks", {
      method: "POST",
      auth: true,
      ...json({
        name: input.name,
        description: input.description,
        projectId: input.projectId,
        assignedTo: input.assigneeId,
        assigneeId: input.createdBy,
        status: toApiStatus(input.status),
      }),
    }),

  updateTask: (id: string, input: TaskUpdate) =>
    request<Task>(`/tasks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      auth: true,
      ...json({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        ...(input.assigneeId !== undefined ? { assignedTo: input.assigneeId } : {}),
        ...(input.status !== undefined ? { status: toApiStatus(input.status) } : {}),
      }),
    }),
  getNotifications:async(id:string)=>{
    const body:any = await request(`/projects/notifications/${encodeURIComponent(id)}`,{method:"GET"});
    return Array.isArray(body) ? body : (body?.data ?? []);
  },
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE", auth: true }),
  reorderTasks: (order: TaskOrderSubmission) =>
    request<Task[]>("/tasks/order", { method: "PUT", auth: true, ...json(order) }),
};
