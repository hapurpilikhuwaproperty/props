"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  const submit = async () => {
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset link is missing or invalid.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset", { token, password });
      setMessage("Password updated. You can sign in now.");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12 max-w-md">
      <h1 className="text-3xl font-semibold mb-2">Create new password</h1>
      <p className="mb-6 text-sm text-slate-500">Use a password with at least 8 characters.</p>

      <div className="space-y-4">
        <input
          className="w-full border rounded-lg px-3 py-2"
          type="password"
          placeholder="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-brand">{message}</p>}
        <button onClick={submit} disabled={loading} className="w-full bg-brand text-white py-2 rounded-lg font-semibold disabled:opacity-60">
          {loading ? "Updating..." : "Update password"}
        </button>
        <Link href="/auth/login" className="block text-center text-sm text-brand">
          Back to login
        </Link>
      </div>
    </div>
  );
}
