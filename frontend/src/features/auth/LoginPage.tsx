import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useLogin } from "./hooks/useLogin";
import { loginSchema, type LoginFormData } from "./validation";
import { ApiException } from "@/lib/api";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-colors";

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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 md:rounded-xl md:border md:border-border md:bg-surface md:p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Connexion</h1>
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-foreground underline underline-offset-4">
              S'inscrire
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="login-email" className="sr-only">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={inputClass}
            />
            {errors.email && (
              <p id="login-email-error" role="alert" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="login-password" className="sr-only">Mot de passe</label>
            <input
              id="login-password"
              type="password"
              placeholder="Mot de passe"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className={inputClass}
            />
            {errors.password && (
              <p id="login-password-error" role="alert" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="text-sm text-destructive">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
