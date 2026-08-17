"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        action={formAction}
        className="flex w-full max-w-[380px] flex-col gap-4 rounded-card border border-line bg-card p-8 shadow-[0_10px_30px_rgba(22,33,62,0.08)]"
      >
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-accent">SAIZA</span>
          <h1 className="text-xl font-medium">Đăng nhập quản trị</h1>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 cursor-pointer rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
