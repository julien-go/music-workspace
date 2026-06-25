import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useRegister } from "./hooks/useRegister";
import { ApiException } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const register = useRegister();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    register.mutate({ email, username, password });
  }

  const error = register.error;
  const apiError = error instanceof ApiException ? error.apiError : null;
  const fieldErrors = apiError?.errors ?? [];
  const generalMessage = apiError ? apiError.message : error?.message;

  return (
    <div className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded border px-3 py-2"
        />
        {generalMessage && !fieldErrors.length && (
          <p className="text-sm text-red-600">{generalMessage}</p>
        )}
        {fieldErrors.map((fe) => (
          <p key={fe.field} className="text-sm text-red-600">
            {fe.field}: {fe.message}
          </p>
        ))}
        <button
          type="submit"
          disabled={register.isPending}
          className="w-full rounded bg-neutral-900 py-2 text-white disabled:opacity-50"
        >
          {register.isPending ? "Creating account…" : "Register"}
        </button>
      </form>
      <p className="text-sm text-neutral-500">
        Already have an account? <Link to="/login" className="underline">Log in</Link>
      </p>
    </div>
  );
}
