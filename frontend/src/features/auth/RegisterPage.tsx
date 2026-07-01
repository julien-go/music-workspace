import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useRegister } from "./hooks/useRegister";
import { registerSchema, type RegisterFormData } from "./validation";
import { ApiException } from "@/lib/api";
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
  const serverMessage =
    apiError && !serverErrors.length
      ? apiError.message
      : error && !apiError
        ? error.message
        : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
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
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className={inputClass}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              {...register("username")}
              className={inputClass}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <input
              type="password"
              placeholder="Mot de passe"
              {...register("password")}
              className={inputClass}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {serverMessage && (
            <p className="text-sm text-destructive">{serverMessage}</p>
          )}
          {serverErrors.map((err, i) => (
            <p key={i} className="text-xs text-destructive">{err}</p>
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
