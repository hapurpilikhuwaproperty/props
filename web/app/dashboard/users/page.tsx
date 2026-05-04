"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth-context";
import { api } from "../../../lib/api";

const roles = ["Admin", "Seller", "Guest", "Agent", "User"] as const;

type AdminUser = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  verified: boolean;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  sellerVerificationStatus: "NOT_REQUESTED" | "PENDING" | "APPROVED" | "REJECTED";
  sellerVerifiedAt: string | null;
  mfaEnabled: boolean;
  createdAt: string;
  role: {
    id: number;
    name: string;
  };
};

export default function AdminUsersPage() {
  const { role, isReady } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isReady) return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    api
      .get("/admin/users", { signal: controller.signal })
      .then((response) => {
        if (isActive) setUsers(response.data);
      })
      .catch((err) => {
        if (err?.code !== "ERR_CANCELED" && isActive) {
          setError(err.response?.data?.message || "Failed to load users");
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isAdmin, isReady]);

  const changeRole = async (userId: number, nextRole: string) => {
    setSavingUserId(userId);
    setError("");
    try {
      const { data } = await api.patch(`/admin/users/${userId}/role`, { role: nextRole });
      setUsers((current) => current.map((user) => (user.id === userId ? data : user)));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update role");
    } finally {
      setSavingUserId(null);
    }
  };

  const setSellerApproval = async (userId: number, approved: boolean) => {
    setSavingUserId(userId);
    setError("");
    try {
      const { data } = await api.patch(`/admin/users/${userId}/seller-approval`, { approved });
      setUsers((current) => current.map((user) => (user.id === userId ? data : user)));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update seller approval");
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) {
    return <div className="container py-12 text-sm text-slate-500">Loading users...</div>;
  }

  if (!isAdmin) {
    return <div className="container py-12 text-sm text-slate-600">Admin access is required.</div>;
  }

  return (
    <div className="container py-10 space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-semibold mt-2">Users and roles</h1>
          <p className="text-sm text-slate-500 mt-1">Promote users, approve sellers, and confirm admin MFA status.</p>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="grid grid-cols-[1.2fr_160px_180px_180px] gap-4 border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>User</span>
          <span>Role</span>
          <span>Seller access</span>
          <span>Admin MFA</span>
        </div>
        {users.map((user) => (
          <div key={user.id} className="grid grid-cols-[1.2fr_160px_180px_180px] gap-4 border-b px-5 py-4 text-sm last:border-b-0">
            <div>
              <p className="font-semibold text-slate-950">{user.name}</p>
              <p className="text-slate-500">{user.email || "No email"}{user.phone ? ` / ${user.phone}` : ""}</p>
              <p className="mt-1 text-xs text-slate-400">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>

            <select
              className="h-10 rounded-lg border px-3"
              value={user.role.name}
              disabled={savingUserId === user.id}
              onChange={(event) => void changeRole(user.id, event.target.value)}
            >
              {roles.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">{user.sellerVerificationStatus.replace("_", " ")}</p>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-60"
                  disabled={savingUserId === user.id}
                  onClick={() => void setSellerApproval(user.id, true)}
                >
                  Approve
                </button>
                <button
                  className="rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-60"
                  disabled={savingUserId === user.id}
                  onClick={() => void setSellerApproval(user.id, false)}
                >
                  Reject
                </button>
              </div>
            </div>

            <div>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {user.role.name === "Admin" ? (user.mfaEnabled ? "MFA enabled" : "MFA setup pending") : "Not required"}
              </span>
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="px-5 py-8 text-sm text-slate-500">No users found.</p>}
      </div>
    </div>
  );
}
