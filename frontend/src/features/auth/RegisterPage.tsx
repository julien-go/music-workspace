import { Link } from "@tanstack/react-router";
import { useDocumentTitle } from "@/components/hooks/useDocumentTitle";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useRegisterForm } from "./hooks/useRegisterForm";

const inputClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-colors";

function FormField({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  registration,
  error,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...registration}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={inputClass}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  useDocumentTitle("Inscription");
  const { register, submit, errors, isPending, serverMessage, serverErrors } = useRegisterForm();

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

        <form onSubmit={submit} className="space-y-4">
          <FormField
            id="register-email"
            label="Email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            registration={register("email")}
            error={errors.email}
          />
          <FormField
            id="register-username"
            label="Nom d'utilisateur"
            type="text"
            placeholder="Nom d'utilisateur"
            autoComplete="username"
            registration={register("username")}
            error={errors.username}
          />
          <FormField
            id="register-password"
            label="Mot de passe"
            type="password"
            placeholder="Mot de passe"
            autoComplete="new-password"
            registration={register("password")}
            error={errors.password}
          />

          {serverMessage && (
            <p role="alert" className="text-sm text-destructive">
              {serverMessage}
            </p>
          )}
          {serverErrors.map((err, i) => (
            <p key={i} role="alert" className="text-xs text-destructive">
              {err}
            </p>
          ))}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création…" : "Créer un compte"}
          </Button>
        </form>
      </div>
    </div>
  );
}
