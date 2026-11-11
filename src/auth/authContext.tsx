import { useCallback } from "react";
import { api } from "../store/api";
import { logout } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export function useAuth() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const signOut = useCallback(() => {
    dispatch(logout());
    dispatch(api.util.resetApiState());
  }, [dispatch]);

  return { user, isAuthenticated: user !== null, logout: signOut };
}
