import { useState, type FormEvent } from "react";
import type { AuthCredentials, User } from "../types";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        <div className="auth-header">
          <div>
            <h2>Authentication</h2>
            <p className="auth-subtitle">Restoring your local session...</p>
          </div>
        </div>

        <p className="muted">Loading current user...</p>
      </section>
    );
  }

  if (isAuthenticated && currentUser) {
    return (
      <section className="card">
        <div className="auth-header">
          <div>
            <h2>Authentication</h2>
            <p className="auth-subtitle">You are authenticated with a JWT access token.</p>
          </div>
        </div>

        <div className="authenticated-user">
          <span className="user-badge">Signed in: {currentUser.email}</span>

          <button type="button" className="secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="auth-header">
        <div>
          <h2>Authentication</h2>
          <p className="auth-subtitle">
            Login or create a local account to manage protected tasks.
          </p>
        </div>
      </div>

      <div className="auth-tabs" aria-label="Authentication mode">
        <button
          type="button"
          className={`auth-tab ${mode === "login" ? "active" : ""}`}
          disabled={mode === "login" || isSubmitting}
          onClick={() => setMode("login")}
        >
          Login
        </button>

        <button
          type="button"
          className={`auth-tab ${mode === "register" ? "active" : ""}`}
          disabled={mode === "register" || isSubmitting}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          Email
          <input
            type="email"
            value={email}
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="form-field">
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
              : "Create account"}
        </button>
      </form>
    </section>
  );
}