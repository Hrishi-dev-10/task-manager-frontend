import type { UserRole } from "../auth/types";

/** Statuses stored by the API. */
export type TaskStatus = "pending" | "in_progress" | "blocked" | "in_review" | "completed";

export const TASK_STATUSES: TaskStatus[] = ["pending", "in_progress", "blocked", "in_review", "completed"];

/** Columns on a project board, left to right. */
export const BOARD_STATUSES = ["in_progress", "blocked", "in_review", "completed"] as const;

export type BoardStatus = (typeof BOARD_STATUSES)[number];

export type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
};

export type ProjectMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  members: ProjectMember[];
  taskCount: number;
  createdAt: string;
};

export type Task = {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  assigneeName: string | null;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  /** Saved by the backend. Lower numbers appear first. */
  displayOrder: number;
};

export type TaskInput = {
  name: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  projectId: string;
  createdBy?:string;
};

export type TaskUpdate = Partial<TaskInput>;

export type ProjectInput = {
  name: string;
  description: string;
  createdBy: string;
  projectMembers: { userId: string }[];
};

export type ProjectUpdate = {
  name: string;
  description: string;
};

//Full task id list for one project, in the new display order.
export type TaskOrderSubmission = {
  projectId: string;
  orderedTaskIds: string[];
};

