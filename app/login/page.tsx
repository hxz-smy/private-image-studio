"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "登录失败");
      }

      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("next") || "/";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <form className="login-panel panel" onSubmit={submit}>
        <div className="mark">
          <LockKeyhole size={18} />
        </div>
        <div>
          <h1>Private Image Studio</h1>
          <p className="subtle">需要访问密码</p>
        </div>
        <div className="field">
          <label htmlFor="password">访问密码</label>
          <input
            autoComplete="current-password"
            autoFocus
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </div>
        <button className="primary-button" disabled={busy || !password} type="submit">
          <LogIn size={18} />
          进入
        </button>
        {error ? <div className="error-box">{error}</div> : null}
      </form>
    </main>
  );
}
