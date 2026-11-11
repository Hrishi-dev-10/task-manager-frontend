import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../auth/authContext";
import { bindNotificationSocket } from "./notifications";

const API_BASE = import.meta.env.API ?? "http://localhost:5000/api/v1";
const SOCKET_URL = API_BASE.replace(/\/api\/v1\/?$/, "");

/** Keeps a Socket.IO connection for the signed-in user and feeds the inbox. */
export function NotificationSocket() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    const socket = io(SOCKET_URL, { auth: { userId } });
    const unbind = bindNotificationSocket(socket);
    return () => {
      unbind();
      socket.disconnect();
    };
  }, [userId]);

  return null;
}
