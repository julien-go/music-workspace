import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useRegister } from "./hooks/useRegister";
import { registerSchema, type RegisterFormData } from "./validation";
import { ApiException, describeError } from "@/lib/api";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-colors";

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
  // The backend 409 tells apart email and username conflicts through its
  // (English) message — translate rather than display it raw.
  const serverMessage = !error
    ? null
    : apiError?.status === 409
      ? apiError.message.startsWith("Username")
        ? "Ce nom d'utilisateur est déjà pris."
        : "Cet email est déjà utilisé."
      : serverErrors.length
        ? null
        : describeError(error, "Impossible de créer le compte. Réessaie.");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 md:rounded-xl md:border md:border-border md:bg-surface md:p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Créer un compte</h1>
          <p className="text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link to="/login" className="text-foreground underline underline-offset-4">
              Se connecter
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="register-email" className="sr-only">Email</label>
            <input
              id="register-email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "register-email-error" : undefined}
              className={inputClass}
            />
            {errors.email && (
              <p id="register-email-error" role="alert" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="register-username" className="sr-only">Nom d'utilisateur</label>
            <input
              id="register-username"
              type="text"
              placeholder="Nom d'utilisateur"
              autoComplete="username"
              {...register("username")}
              aria-invalid={errors.username ? true : undefined}
              aria-describedby={errors.username ? "register-username-error" : undefined}
              className={inputClass}
            />
            {errors.username && (
              <p id="register-username-error" role="alert" className="text-xs text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="register-password" className="sr-only">Mot de passe</label>
            <input
              id="register-password"
              type="password"
              placeholder="Mot de passe"
              autoComplete="new-password"
              {...register("password")}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "register-password-error" : undefined}
              className={inputClass}
            />
            {errors.password && (
              <p id="register-password-error" role="alert" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverMessage && (
            <p role="alert" className="text-sm text-destructive">{serverMessage}</p>
          )}
          {serverErrors.map((err, i) => (
            <p key={i} role="alert" className="text-xs text-destructive">{err}</p>
          ))}

          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Création…" : "Créer un compte"}
          </Button>
        </form>
      </div>
    </div>
  );
}
