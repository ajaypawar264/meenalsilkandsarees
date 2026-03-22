"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

     const adminUser = await adminLogin(cleanEmail, cleanPassword);

localStorage.setItem("admin_logged_in", "true");
localStorage.setItem("admin_email", adminUser.email || cleanEmail);
localStorage.setItem("admin_name", adminUser.name || "Admin");

router.push("/admin");
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMsg(error?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8"
      >
        <h1 className="text-center text-3xl font-bold text-yellow-400">
          Admin Login
        </h1>

        <p className="mt-2 text-center text-sm text-white/60">
          Login with admin email and password
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="mt-6">
          <label className="mb-2 block text-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@minal.com"
            className="w-full rounded-xl border border-white/20 bg-black px-4 py-3 outline-none focus:border-yellow-400"
            required
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="******"
            className="w-full rounded-xl border border-white/20 bg-black px-4 py-3 outline-none focus:border-yellow-400"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-yellow-500 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}