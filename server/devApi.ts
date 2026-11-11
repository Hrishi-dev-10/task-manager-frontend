import type { IncomingMessage, ServerResponse } from "node:http";
import { handleApiRequest } from "./api.ts";

/** Development API mounted at /api by the Vite server. */
export function devApiMiddleware() {
  return (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
    const url = req.url ?? "";
    if (!url.startsWith("/api")) {
      next();
      return;
    }

    void handleApiRequest(req, res).catch(() => {
      if (res.headersSent) return;
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ message: "The server could not complete that request." }));
    });
  };
}
