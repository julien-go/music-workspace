import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLogin } from "./hooks/useLogin";
import { ApiException } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate({ email, password });
  }

  const errorMessage =
    login.error instanceof ApiException
      ? login.error.apiError.message
      : login.error?.message;

  return (
    <div className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Login</h1>
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
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded bg-neutral-900 py-2 text-white disabled:opacity-50"
        >
          {login.isPending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="text-sm text-neutral-500">
        No account? <Link to="/register" className="underline">Register</Link>
      </p>
    </div>
  );
}
