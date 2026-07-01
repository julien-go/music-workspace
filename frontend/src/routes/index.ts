import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { fetchMe } from "@/features/auth/api";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import HomePage from "@/features/home/HomePage";
import NotFoundPage from "@/features/not-found/NotFoundPage";
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import DashboardPage from "@/features/projects/DashboardPage";
import ProjectDetailPage from "@/features/projects/ProjectDetailPage";
import PublicProjectPage from "@/features/projects/PublicProjectPage";
import TrackDetailPage from "@/features/tracks/TrackDetailPage";

let authChecked = false;

async function rehydrateAuth() {
  if (authChecked) return;
  authChecked = true;
  try {
    const user = await fetchMe();
    useAuthStore.getState().setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } catch {
    useAuthStore.getState().clearUser();
  }
}

function requireAuth() {
  if (!useAuthStore.getState().user) {
    throw redirect({ to: "/login" });
  }
}

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
  beforeLoad: rehydrateAuth,
});

// Public layout — topbar with Login / Register
const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public-layout",
  component: PublicLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/",
  component: HomePage,
  beforeLoad: () => {
    if (useAuthStore.getState().user) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

const publicProjectRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/p/$projectId",
  component: PublicProjectPage,
});

// Auth layout — topbar with Dashboard / username / Logout; redirects if not authenticated
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth-layout",
  component: AuthLayout,
  beforeLoad: requireAuth,
});

const dashboardRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/projects/$projectId",
  component: ProjectDetailPage,
});

// Intentional sibling of projectDetailRoute (not a child) — ProjectDetailPage has no <Outlet />.
// Any project-level beforeLoad/loader guards must be added at authLayoutRoute or page level.
const trackDetailRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/projects/$projectId/tracks/$trackId",
  component: TrackDetailPage,
});

// Auth pages without layout
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([homeRoute, publicProjectRoute]),
  authLayoutRoute.addChildren([dashboardRoute, projectDetailRoute, trackDetailRoute]),
  loginRoute,
  registerRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
