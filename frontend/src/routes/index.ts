import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import HomePage from "@/components/HomePage";
import NotFoundPage from "@/components/NotFoundPage";
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import DashboardPage from "@/features/projects/DashboardPage";
import ProjectDetailPage from "@/features/projects/ProjectDetailPage";
import PublicProjectPage from "@/features/projects/PublicProjectPage";
import TrackDetailPage from "@/features/tracks/TrackDetailPage";

function requireAuth() {
  if (!useAuthStore.getState().user) {
    throw redirect({ to: "/login" });
  }
}

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

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

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
  beforeLoad: requireAuth,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId",
  component: ProjectDetailPage,
  beforeLoad: requireAuth,
});

const trackDetailRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: "/tracks/$trackId",
  component: TrackDetailPage,
  beforeLoad: requireAuth,
});

const publicProjectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/p/$projectId",
  component: PublicProjectPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
  projectDetailRoute.addChildren([trackDetailRoute]),
  publicProjectRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
