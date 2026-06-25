import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useLogin } from "./hooks/useLogin";
import { loginSchema, type LoginFormData } from "./validation";
import { ApiException } from "@/lib/api";

export default function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  function onSubmit(data: LoginFormData) {
    login.mutate(data);
  }

  const serverError =
    login.error instanceof ApiException
      ? login.error.apiError.message
      : login.error?.message;

  return (
    <div className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Email"
            {...register("email")}
            className="w-full rounded border px-3 py-2"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            {...register("password")}
            className="w-full rounded border px-3 py-2"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded bg-neutral-900 py-2 text-white disabled:opacity-50"
        >
          {login.isPending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="text-sm text-neutral-500">
        No account?{" "}
        <Link to="/register" className="underline">
          Register
        </Link>
      </p>
    </div>
  );
}
