import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiException, describeError } from "@/lib/api";
import { useRegister } from "./useRegister";
import { registerSchema, type RegisterFormData } from "../validation";

// The backend 409 tells apart email and username conflicts through its
// (English) message — translate rather than display it raw.
function resolveServerMessage(
  error: unknown,
  apiError: ApiException["apiError"] | null,
  serverErrorCount: number,
): string | null {
  if (!error) return null;
  if (apiError?.status === 409) {
    return apiError.message.startsWith("Username")
      ? "Ce nom d'utilisateur est déjà pris."
      : "Cet email est déjà utilisé.";
  }
  if (serverErrorCount) return null;
  return describeError(error, "Impossible de créer le compte. Réessaie.");
}

export function useRegisterForm() {
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const submit = handleSubmit((data) => registerMutation.mutate(data));

  const error = registerMutation.error;
  const apiError = error instanceof ApiException ? error.apiError : null;
  const serverErrors = apiError?.errors ?? [];
  const serverMessage = resolveServerMessage(error, apiError, serverErrors.length);

  return {
    register,
    submit,
    errors,
    isPending: registerMutation.isPending,
    serverMessage,
    serverErrors,
  };
}
