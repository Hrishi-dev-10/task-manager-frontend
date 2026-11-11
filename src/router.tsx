import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import AuthLayout from "./layouts/AuthLayout";
import { AdminRoute, GuestRoute, ProtectedRoute } from "./auth/guards";
import Signup from "./pages/Signup";
import DashboardLayout from "./layouts/DashboardLayout";
import NotFound from "./pages/NotFound";
import ProjectsList from "./pages/ProjectsList";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import type { RouteHandle } from "./layouts/pageMeta";
import ForgotPassword from "./pages/ForgotPassword";

function page(title: string): RouteHandle {
  return {
    title,
    breadcrumb: [
      { label: "Projects", to: "/projects" },
      { label: title },
    ],
  };
}

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <Login /> },
          { path: "/signup", element: <Signup /> },
          { path: "/forgotpassword", element: <ForgotPassword /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/", element: <Navigate to="/projects" replace /> },
          { path: "/projects", element: <ProjectsList />, handle: { title: "Projects" } satisfies RouteHandle },
          {
            path: "/projects/:projectId",
            element: <ProjectDetail />,
            handle: {
              title: "Project",
              breadcrumb: [
                { label: "Projects", to: "/projects" },
                { label: "Project" },
              ],
            } satisfies RouteHandle,
          },
          { path: "/tasks", element: <Tasks />, handle: page("Tasks") },
          { path: "/settings", element: <Settings />, handle: page("Settings") },
          { path: "/list", element: <Navigate to="/projects" replace /> },
          {
            element: <AdminRoute />,
            children: [{ path: "/users", element: <Users />, handle: page("Users") }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
