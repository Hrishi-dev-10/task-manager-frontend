import { api } from "../api/client";
import type { Task, TaskOrderSubmission } from "../api/types";

/**
 * Drag-and-drop integration point.
 *
 * The hand-written drag-and-drop component should call this when a drop
 * finishes. Do not keep the new order only in component state: this request
 * is what the backend persists, and the returned tasks are the saved order.
 *
 *   const saved = await submitTaskOrder({
 *     projectId,
 *     orderedTaskIds, // every task in that project, first to last
 *   });
 */
export function submitTaskOrder(order: TaskOrderSubmission): Promise<Task[]> {
  return api.reorderTasks(order);
}

export type { TaskOrderSubmission };
