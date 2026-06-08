import { useState } from "react";
import type { AuthCredentials, User } from "../types/auth";

type AuthMode = "login" | "register";

type AuthPanelProps = {
  currentUser: User | null;
  isLoading: boolean;
  isSubmitting: boolean;
  onLogin: (credentials: AuthCredentials) => Promise<void>;
  onRegister: (credentials: AuthCredentials) => Promise<void>;
  onLogout: () => void;
};

export function AuthPanel({
  currentUser,
  isLoading,
  isSubmitting,
  onLogin,
  onRegister,
  onLogout
}: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("strong-password");

  const isAuthenticated = Boolean(currentUser);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const credentials: AuthCredentials = {
      email,
      password
    };

    if (mode === "login") {
      await onLogin(credentials);
      return;
    }

    await onRegister(credentials);
  }

  if (isLoading) {
    return (
      <section className="card">
        <h2>Authentication</h2>
        <p>Loading current user...</p>
      </section>
    );
  }

  if (isAuthenticated && currentUser) {
    return (
      <section className="card">
        <h2>Authentication</h2>
        <p>
          Logged in as <strong>{currentUser.email}</strong>
        </p>

        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Authentication</h2>

      <div className="button-row">
        <button
          type="button"
          disabled={mode === "login" || isSubmitting}
          onClick={() => setMode("login")}
        >
          Login
        </button>

        <button
          type="button"
          disabled={mode === "register" || isSubmitting}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            disabled={isSubmitting}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Please wait..."
            : mode === "login"
              ? "Login"
              : "Register"}
        </button>
      </form>
    </section>
  );
}