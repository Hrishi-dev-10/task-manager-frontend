import type { IncomingMessage, ServerResponse } from "node:http";
import type { UserRole } from "../src/auth/types.ts";

type TaskStatus = "pending" | "in_progress" | "blocked" | "in_review" | "completed";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
};

type ProjectRecord = {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
};

type TaskRecord = {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  displayOrder: number;
};

const users: UserRecord[] = [
  { id: "user-alex", name: "Alex Morgan", email: "demo@example.com", role: "ADMIN", title: "Workspace owner" },
  { id: "user-jordan", name: "Jordan Lee", email: "member@example.com", role: "member", title: "Product designer" },
  { id: "user-priya", name: "Priya Shah", email: "priya@example.com", role: "member", title: "Engineer" },
  { id: "user-sam", name: "Sam Okonkwo", email: "sam@example.com", role: "member", title: "Engineer" },
];

const projects: ProjectRecord[] = [
  {
    id: "project-website",
    name: "Website redesign",
    description: "New marketing site, navigation, and pricing content.",
    memberIds: ["user-alex", "user-jordan", "user-priya"],
    createdAt: "2026-10-02T09:00:00.000Z",
  },
  {
    id: "project-mobile",
    name: "Mobile app",
    description: "iOS and Android release for the field team.",
    memberIds: ["user-alex", "user-jordan"],
    createdAt: "2026-10-18T09:00:00.000Z",
  },
  {
    id: "project-billing",
    name: "Billing migration",
    description: "Move invoices onto the new payment provider.",
    memberIds: ["user-alex", "user-sam"],
    createdAt: "2026-11-01T09:00:00.000Z",
  },
];

const tasks: TaskRecord[] = [
  task("task-pricing", "Rewrite the pricing page", "Replace the current pricing layout and copy.", "in_progress", "user-alex", "project-website", 0, "2026-10-20T09:00:00.000Z", "2026-11-09T08:00:00.000Z"),
  task("task-nav", "Review navigation prototypes", "Leave notes on the two homepage directions.", "in_review", "user-jordan", "project-website", 1, "2026-10-22T09:00:00.000Z", "2026-11-08T12:00:00.000Z"),
  task("task-case", "Publish the case study", "Ship the redesigned customer story.", "completed", "user-priya", "project-website", 2, "2026-10-28T09:00:00.000Z", "2026-11-04T15:00:00.000Z"),
  task("task-push", "Fix notification permission", "The prompt never appears on a fresh install.", "blocked", "user-alex", "project-mobile", 0, "2026-10-21T09:00:00.000Z", "2026-11-09T07:00:00.000Z"),
  task("task-notes", "Draft the release notes", "Cover the permission fix and the new home screen.", "in_progress", "user-jordan", "project-mobile", 1, "2026-10-30T09:00:00.000Z", "2026-11-07T10:00:00.000Z"),
  task("task-map", "Map legacy invoice fields", "Match the old export to the new invoice schema.", "in_progress", "user-sam", "project-billing", 0, "2026-11-02T09:00:00.000Z", "2026-11-06T11:00:00.000Z"),
  task("task-qa", "QA the webhook retries", "Confirm failed payments retry twice.", "completed", "user-alex", "project-billing", 1, "2026-11-03T09:00:00.000Z", "2026-11-05T16:00:00.000Z"),
];

function task(
  id: string,
  name: string,
  description: string,
  status: TaskStatus,
  assigneeId: string,
  projectId: string,
  displayOrder: number,
  createdAt: string,
  updatedAt: string,
): TaskRecord {
  return { id, name, description, status, assigneeId, projectId, displayOrder, createdAt, updatedAt };
}

class HttpError extends Error {
  status: number;
  fields: Record<string, string>;

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.fields = fields;
  }
}

const STATUSES: TaskStatus[] = ["pending", "in_progress", "blocked", "in_review", "completed"];

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, "Send valid JSON.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function userByEmail(email: string) {
  return users.find((user) => user.email === email.toLowerCase());
}

/** Demo passwords. Only these two accounts can sign in. */
const loginPasswords = new Map<string, string>([
  ["demo@example.com", "12345"],
  ["member@example.com", "12345"],
]);

async function login(req: IncomingMessage, res: ServerResponse) {
  const body = await readJson(req);
  if (!isRecord(body)) throw new HttpError(400, "Send valid JSON.");
  const email = text(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const fields: Record<string, string> = {};
  if (!email) fields.email = "Enter your email.";
  if (!password) fields.password = "Enter your password.";
  if (Object.keys(fields).length > 0) throw new HttpError(400, "Check the highlighted fields.", fields);

  const user = userByEmail(email);
  if (!user || loginPasswords.get(email) !== password) {
    throw new HttpError(401, "Incorrect email or password.");
  }
  send(res, 200, { user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

function requireUser(req: IncomingMessage) {
  const header = req.headers["x-user-email"];
  const email = Array.isArray(header) ? header[0] : header;
  const user = email ? userByEmail(email) : undefined;
  // Accounts from the real login API are not in this sample store.
  // Fall back to the demo ADMIN so the seeded tasks stay visible while those APIs are written.
  return user ?? users.find((item) => item.role === "ADMIN") ?? users[0];
}

function visibleProjects(user: UserRecord) {
  if (user.role === "ADMIN") return projects;
  return projects.filter((project) => project.memberIds.includes(user.id));
}

function canAccessProject(user: UserRecord, project: ProjectRecord) {
  return user.role === "ADMIN" || project.memberIds.includes(user.id);
}

function requireProject(user: UserRecord, id: string) {
  const project = projects.find((item) => item.id === id);
  if (!project || !canAccessProject(user, project)) throw new HttpError(404, "That project could not be found.");
  return project;
}

function projectTasks(projectId: string) {
  return tasks
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt.localeCompare(b.createdAt));
}

function toMember(id: string) {
  const user = users.find((item) => item.id === id);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function toProject(project: ProjectRecord) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    members: project.memberIds.map(toMember).filter((member) => member !== null),
    taskCount: tasks.filter((item) => item.projectId === project.id).length,
    createdAt: project.createdAt,
  };
}

function toTask(record: TaskRecord) {
  const assignee = record.assigneeId ? users.find((user) => user.id === record.assigneeId) : undefined;
  const project = projects.find((item) => item.id === record.projectId);
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    status: record.status,
    assigneeId: record.assigneeId,
    assigneeName: assignee?.name ?? null,
    projectId: record.projectId,
    projectName: project?.name ?? "Unknown project",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    displayOrder: record.displayOrder,
  };
}

function visibleTasks(user: UserRecord) {
  const ids = new Set(visibleProjects(user).map((project) => project.id));
  return tasks
    .filter((item) => ids.has(item.projectId))
    .sort((a, b) => a.projectId.localeCompare(b.projectId) || a.displayOrder - b.displayOrder);
}

function validateName(value: unknown, label: string, max: number, fields: Record<string, string>, key: string) {
  const name = text(value);
  if (!name) fields[key] = `Enter a ${label}.`;
  else if (name.length > max) fields[key] = `Use a ${label} under ${max} characters.`;
  return name;
}

function projectFields(body: Record<string, unknown>, includeMembers: boolean) {
  const fields: Record<string, string> = {};
  const name = validateName(body.name, "project name", 80, fields, "name");
  const description = text(body.description);
  if (!description) fields.description = "Enter a description.";
  else if (description.length > 500) fields.description = "Use a description under 500 characters.";

  let memberIds: string[] = [];
  if (includeMembers) {
    if (!Array.isArray(body.memberIds) || body.memberIds.length === 0) {
      fields.memberIds = "Choose at least one member.";
    } else {
      memberIds = body.memberIds.filter((id): id is string => typeof id === "string");
      if (memberIds.length !== body.memberIds.length || memberIds.some((id) => !users.some((user) => user.id === id))) {
        fields.memberIds = "Choose members from the workspace directory.";
      }
    }
  }

  if (Object.keys(fields).length > 0) throw new HttpError(400, "Check the highlighted fields.", fields);
  return { name, description, memberIds: [...new Set(memberIds)] };
}

function assertAssignee(project: ProjectRecord, assigneeId: string | null) {
  if (assigneeId && !project.memberIds.includes(assigneeId)) {
    throw new HttpError(400, "Check the highlighted fields.", {
      assigneeId: "Choose a member of this project.",
    });
  }
}

function taskFields(body: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, string> = {};
  const result: {
    name?: string;
    description?: string;
    status?: TaskStatus;
    assigneeId?: string | null;
    projectId?: string;
  } = {};

  if (!partial || "name" in body) {
    result.name = validateName(body.name, "task name", 120, fields, "name");
  }
  if (!partial || "description" in body) {
    const description = text(body.description);
    if (description.length > 1000) fields.description = "Use a description under 1000 characters.";
    result.description = description;
  }
  if (!partial || "status" in body) {
    if (!STATUSES.includes(body.status as TaskStatus)) fields.status = "Choose a status.";
    else result.status = body.status as TaskStatus;
  }
  if (!partial || "projectId" in body) {
    const projectId = text(body.projectId);
    if (!projectId) fields.projectId = "Choose a project.";
    result.projectId = projectId;
  }
  if (!partial || "assigneeId" in body) {
    if (body.assigneeId === null || body.assigneeId === "") result.assigneeId = null;
    else if (typeof body.assigneeId !== "string") fields.assigneeId = "Choose a member of this project.";
    else result.assigneeId = body.assigneeId;
  }
  if (Object.keys(fields).length > 0) throw new HttpError(400, "Check the highlighted fields.", fields);
  return result;
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const parts = url.pathname.split("/").filter(Boolean);
    const method = req.method ?? "GET";
    if (parts[0] !== "api") {
      send(res, 404, { message: "That address was not found." });
      return;
    }
    if (method === "POST" && parts[1] === "auth" && parts[2] === "login" && parts.length === 3) {
      await login(req, res);
      return;
    }
    await route(requireUser(req), method, parts, url, req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      send(res, error.status, { message: error.message, fields: error.fields });
      return;
    }
    send(res, 500, { message: "The server could not complete that request." });
  }
}

async function route(
  user: UserRecord,
  method: string,
  parts: string[],
  url: URL,
  req: IncomingMessage,
  res: ServerResponse,
) {
  const resource = parts[1];

  if (resource === "projects" && parts.length === 2 && method === "POST") {
    if (user.role !== "ADMIN") throw new HttpError(403, "Only administrators can create projects.");
    const body = await readJson(req);
    if (!isRecord(body)) throw new HttpError(400, "Send valid JSON.");
    const input = projectFields(body, true);
    const project: ProjectRecord = {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      memberIds: input.memberIds,
      createdAt: new Date().toISOString(),
    };
    projects.push(project);
    send(res, 201, toProject(project));
    return;
  }

  if (resource === "projects" && parts.length === 3 && method === "PATCH") {
    if (user.role !== "ADMIN") throw new HttpError(403, "Only administrators can edit projects.");
    const project = projects.find((item) => item.id === parts[2]);
    if (!project) throw new HttpError(404, "That project could not be found.");
    const body = await readJson(req);
    if (!isRecord(body)) throw new HttpError(400, "Send valid JSON.");
    const input = projectFields(body, false);
    project.name = input.name;
    project.description = input.description;
    send(res, 200, toProject(project));
    return;
  }

  if (resource === "projects" && parts.length === 3 && method === "DELETE") {
    if (user.role !== "ADMIN") throw new HttpError(403, "Only administrators can delete projects.");
    const index = projects.findIndex((item) => item.id === parts[2]);
    if (index === -1) throw new HttpError(404, "That project could not be found.");
    const id = projects[index].id;
    projects.splice(index, 1);
    for (let cursor = tasks.length - 1; cursor >= 0; cursor -= 1) {
      if (tasks[cursor].projectId === id) tasks.splice(cursor, 1);
    }
    res.statusCode = 204;
    res.end();
    return;
  }

  if (resource === "projects" && parts.length === 4 && parts[3] === "members" && method === "POST") {
    if (user.role !== "ADMIN") throw new HttpError(403, "Only administrators can change project members.");
    const project = projects.find((item) => item.id === parts[2]);
    if (!project) throw new HttpError(404, "That project could not be found.");
    const body = await readJson(req);
    const userId = isRecord(body) ? text(body.userId) : "";
    if (!users.some((item) => item.id === userId)) {
      throw new HttpError(400, "Check the highlighted fields.", { userId: "Choose a person from the directory." });
    }
    if (project.memberIds.includes(userId)) {
      throw new HttpError(400, "That person is already a member of this project.", { userId: "That person is already a member." });
    }
    project.memberIds.push(userId);
    send(res, 200, toProject(project));
    return;
  }

  if (resource === "projects" && parts.length === 5 && parts[3] === "members" && method === "DELETE") {
    if (user.role !== "ADMIN") throw new HttpError(403, "Only administrators can change project members.");
    const project = projects.find((item) => item.id === parts[2]);
    if (!project) throw new HttpError(404, "That project could not be found.");
    const userId = decodeURIComponent(parts[4] ?? "");
    if (!project.memberIds.includes(userId)) throw new HttpError(404, "That person is not a member of this project.");
    if (project.memberIds.length === 1) {
      throw new HttpError(400, "A project needs at least one member.");
    }
    project.memberIds = project.memberIds.filter((id) => id !== userId);
    send(res, 200, toProject(project));
    return;
  }

  if (resource === "tasks" && parts.length === 2 && method === "GET") {
    const projectId = url.searchParams.get("projectId");
    const scoped = projectId ? projectTasks(requireProject(user, projectId).id) : visibleTasks(user);
    send(res, 200, scoped.map(toTask));
    return;
  }

  if (resource === "tasks" && parts.length === 2 && method === "POST") {
    const body = await readJson(req);
    if (!isRecord(body)) throw new HttpError(400, "Send valid JSON.");
    const input = taskFields(body, false);
    const project = requireProject(user, input.projectId ?? "");
    assertAssignee(project, input.assigneeId ?? null);
    const related = projectTasks(project.id);
    const now = new Date().toISOString();
    const record: TaskRecord = {
      id: crypto.randomUUID(),
      name: input.name ?? "",
      description: input.description ?? "",
      status: input.status ?? "pending",
      assigneeId: input.assigneeId ?? null,
      projectId: project.id,
      createdAt: now,
      updatedAt: now,
      displayOrder: related.length === 0 ? 0 : Math.max(...related.map((item) => item.displayOrder)) + 1,
    };
    tasks.push(record);
    send(res, 201, toTask(record));
    return;
  }

  if (resource === "tasks" && parts[2] === "order" && parts.length === 3 && method === "PUT") {
    const body = await readJson(req);
    if (!isRecord(body) || typeof body.projectId !== "string" || !Array.isArray(body.orderedTaskIds)) {
      throw new HttpError(400, "Send the project and the full task order.");
    }
    const project = requireProject(user, body.projectId);
    const orderedTaskIds = body.orderedTaskIds.filter((id): id is string => typeof id === "string");
    const current = projectTasks(project.id);
    const expected = new Set(current.map((item) => item.id));
    const received = new Set(orderedTaskIds);
    if (
      orderedTaskIds.length !== current.length ||
      received.size !== expected.size ||
      [...expected].some((id) => !received.has(id))
    ) {
      throw new HttpError(400, "Include every task in the project, with no duplicates.");
    }
    orderedTaskIds.forEach((id, index) => {
      const record = tasks.find((item) => item.id === id);
      if (!record) return;
      record.displayOrder = index;
      record.updatedAt = new Date().toISOString();
    });
    send(res, 200, projectTasks(project.id).map(toTask));
    return;
  }

  if (resource === "tasks" && parts.length === 3 && method === "PATCH") {
    const record = tasks.find((item) => item.id === parts[2]);
    if (!record) throw new HttpError(404, "That task could not be found.");
    requireProject(user, record.projectId);
    const body = await readJson(req);
    if (!isRecord(body)) throw new HttpError(400, "Send valid JSON.");
    const input = taskFields(body, true);
    const nextProjectId = input.projectId ?? record.projectId;
    const project = requireProject(user, nextProjectId);
    const assigneeId = input.assigneeId === undefined ? record.assigneeId : input.assigneeId;
    assertAssignee(project, assigneeId);
    if (input.name !== undefined) record.name = input.name;
    if (input.description !== undefined) record.description = input.description;
    if (input.status !== undefined) record.status = input.status;
    if (input.assigneeId !== undefined) record.assigneeId = input.assigneeId;
    if (input.projectId && input.projectId !== record.projectId) {
      record.projectId = project.id;
      const related = projectTasks(project.id).filter((item) => item.id !== record.id);
      record.displayOrder = related.length === 0 ? 0 : Math.max(...related.map((item) => item.displayOrder)) + 1;
    }
    record.updatedAt = new Date().toISOString();
    send(res, 200, toTask(record));
    return;
  }

  if (resource === "tasks" && parts.length === 3 && method === "DELETE") {
    if (user.role !== "ADMIN") throw new HttpError(403, "Only administrators can delete tasks.");
    const index = tasks.findIndex((item) => item.id === parts[2]);
    if (index === -1) throw new HttpError(404, "That task could not be found.");
    tasks.splice(index, 1);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (method === "GET" && resource === "projects" && parts.length === 3) {
    send(res, 200, toProject(requireProject(user, parts[2])));
    return;
  }

  if (method === "GET" && resource === "projects" && parts.length === 2) {
    send(res, 200, visibleProjects(user).map(toProject));
    return;
  }

  if (method === "GET" && resource === "users" && parts.length === 2) {
    if (user.role !== "ADMIN") throw new HttpError(403, "Only administrators can view the directory.");
    send(res, 200, users);
    return;
  }

  send(res, 404, { message: "That address was not found." });
}
