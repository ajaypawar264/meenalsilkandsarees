"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RegisterResponse = {
  success: boolean;
  message?: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [personalKey, setPersonalKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const cleanName = name.trim();
    const cleanMobile = mobile.trim();
    const cleanPassword = password.trim();
    const cleanPersonalKey = personalKey.trim();

    if (!cleanName || !cleanMobile || !cleanPassword || !cleanPersonalKey) {
      setMessage("Please fill all fields");
      return;
    }

    if (!/^\d{10}$/.test(cleanMobile)) {
      setMessage("Please enter a valid 10-digit mobile number");
      return;
    }

    if (cleanPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    if (cleanPersonalKey.length < 4) {
      setMessage("Personal key must be at least 4 characters");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          mobile: cleanMobile,
          password: cleanPassword,
          personalKey: cleanPersonalKey,
        }),
      });

      const data: RegisterResponse = await res.json();
      console.log("REGISTER RESPONSE:", data);

      if (!res.ok || !data?.success) {
        setMessage(data?.message || "Registration failed");
        return;
      }

      setMessage("Account created successfully ✅");

      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      console.error("Register error:", error);
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

          <h1 className="mt-3 text-center text-3xl font-bold">
            Create Account
          </h1>
          <p className="mt-2 text-center text-sm text-white/60">
            Mobile number, password ani personal key save kara
          </p>

          <form onSubmit={handleRegister} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/80">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-xl border border-white/20 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                required
              />
            </div>

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
                placeholder="Create password"
                className="w-full rounded-xl border border-white/20 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/80">
                Personal Key
              </label>
              <input
                type="text"
                value={personalKey}
                onChange={(e) => setPersonalKey(e.target.value)}
                placeholder="Create personal key"
                className="w-full rounded-xl border border-white/20 bg-black px-4 py-3 outline-none focus:border-yellow-400"
                required
              />
              <p className="mt-2 text-xs text-white/50">
                Password reset sathi hi key lagel.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-yellow-500 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            {message && (
              <p
                className={`text-sm ${
                  message.includes("successfully")
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {message}
              </p>
            )}
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-cyan-300 hover:text-cyan-200">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}