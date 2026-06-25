import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useRegister } from "./hooks/useRegister";
import { registerSchema, type RegisterFormData } from "./validation";
import { ApiException } from "@/lib/api";

export default function RegisterPage() {
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  function onSubmit(data: RegisterFormData) {
    registerMutation.mutate(data);
  }

  const error = registerMutation.error;
  const apiError = error instanceof ApiException ? error.apiError : null;
  const serverErrors = apiError?.errors ?? [];
  const serverMessage =
    apiError && !serverErrors.length ? apiError.message : error && !apiError ? error.message : null;

  return (
    <div className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Register</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Email"
            required
            {...register("email")}
            className="w-full rounded border px-3 py-2"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <input
            type="text"
            placeholder="Username"
            required
            {...register("username")}
            className="w-full rounded border px-3 py-2"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
          )}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            required
            {...register("password")}
            className="w-full rounded border px-3 py-2"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        {serverMessage && <p className="text-sm text-red-600">{serverMessage}</p>}
        {serverErrors.map((err, i) => (
          <p key={i} className="text-sm text-red-600">{err}</p>
        ))}
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded bg-neutral-900 py-2 text-white disabled:opacity-50"
        >
          {registerMutation.isPending ? "Creating account…" : "Register"}
        </button>
      </form>
      <p className="text-sm text-neutral-500">
        Already have an account?{" "}
        <Link to="/login" className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
