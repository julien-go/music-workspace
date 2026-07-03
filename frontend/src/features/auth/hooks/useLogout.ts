import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { queryClient } from "@/lib/queryClient";
import { logout } from "../api";

export function useLogout() {
  const clearUser = useAuthStore((s) => s.clearUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearUser();
      queryClient.clear();
      navigate({ to: "/" });
    },
  });
}
