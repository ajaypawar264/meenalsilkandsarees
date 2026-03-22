"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone || !message) {
      alert("Please fill all fields");
      return;
    }

    // Future: Firebase save karu shakto
    console.log({ name, phone, message });

    setSuccess("Message sent successfully!");
    setName("");
    setPhone("");
    setMessage("");
  };

  return (
    <main className="min-h-screen bg-[#f7f7f9] px-4 py-12 md:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-4xl font-bold text-[#233f99] md:text-5xl">
          Contact Us
        </h1>

        <p className="mt-4 text-center text-slate-500">
          Have questions? We’d love to hear from you.
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-3xl bg-white p-8 shadow-sm"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#233f99]"
            />

            <input
              type="tel"
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#233f99]"
            />
          </div>

          <textarea
            placeholder="Your Message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#233f99]"
          />

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-[#233f99] py-3 font-semibold text-white hover:bg-[#1c327c]"
          >
            Send Message
          </button>

          {success && (
            <p className="mt-4 text-center text-green-600">{success}</p>
          )}
        </form>

        {/* Contact Info */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="font-semibold text-[#233f99]">Phone</p>
            <p className="mt-2 text-slate-600">+91 9876543210</p>
          </div>

          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="font-semibold text-[#233f99]">Email</p>
            <p className="mt-2 text-slate-600">
              meenalsilkstore@gmail.com
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="font-semibold text-[#233f99]">Location</p>
            <p className="mt-2 text-slate-600">
              Pune, Maharashtra
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}