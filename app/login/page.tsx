"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type LoginResponse = {
  success: boolean;
  message?: string;
  user?: {
    id?: string;
    name?: string;
    mobile?: string;
  };
};

export default function UserLoginPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const cleanMobile = mobile.trim();
    const cleanPassword = password.trim();

    if (!cleanMobile || !cleanPassword) {
      setMessage("Please enter mobile number and password");
      return;
    }

    if (!/^\d{10}$/.test(cleanMobile)) {
      setMessage("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: cleanMobile,
          password: cleanPassword,
        }),
      });

      const data: LoginResponse = await res.json();
      console.log("LOGIN RESPONSE:", data);

      if (!res.ok || !data?.success || !data?.user) {
        setMessage(data?.message || "Login failed");
        return;
      }

      localStorage.setItem("user_mobile", data.user.mobile || "");
      localStorage.setItem("user_name", data.user.name || "");
      localStorage.setItem("user_id", data.user.id || "");

      setMessage("Login successful ✅");

      setTimeout(() => {
        router.push("/");   // ← main change
      }, 800);

    } catch (error) {
      console.error("Login error:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#12090f] to-[#1a0d10] px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <p className="text-center text-sm uppercase tracking-[0.25em] text-yellow-400">
            Minal Silk
          </p>

          <h1 className="mt-3 text-center text-3xl font-bold">User Login</h1>
          <p className="mt-2 text-center text-sm text-white/60">
            Mobile number ani password ne login kara
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/80">
                Mobile Number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="Enter mobile number"
                className="w-full rounded-xl border border-white/20 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/80">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-white/20 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-yellow-500 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {message && (
              <p
                className={`text-sm ${
                  message.includes("successful")
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {message}
              </p>
            )}
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="text-cyan-300 hover:text-cyan-200"
            >
              Forgot Password?
            </Link>

            <Link
              href="/register"
              className="text-yellow-300 hover:text-yellow-200"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-white/60 hover:text-white">
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}