"use client";

import { useEffect, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/admin/password";
import { setPassword, type SetPasswordState } from "./actions";

const initialState: SetPasswordState = { error: null, success: false };

export function SetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [password, setPasswordValue] = useState("");
  const [state, formAction, pending] = useActionState(setPassword, initialState);

  useEffect(() => {
    const supabase = createClient();
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    const resolveSession = accessToken && refreshToken
      ? supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      : supabase.auth.getSession();

    resolveSession.then(({ data }) => {
      const session = "session" in data ? data.session : null;
      setReady(!!session);
      if (!session) {
        setSessionError("Đường dẫn không hợp lệ hoặc đã hết hạn. Hãy xin quản trị viên gửi lời mời lại.");
      } else {
        window.history.replaceState(null, "", window.location.pathname);
      }
    });
  }, []);

  useEffect(() => {
    if (state.success) router.replace("/admin");
  }, [state.success, router]);

  const liveCheck = password ? validatePassword(password) : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-[380px] flex-col gap-4 rounded-card border border-line bg-card p-8 shadow-[0_10px_30px_rgba(22,33,62,0.08)]">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-accent">SAIZA</span>
          <h1 className="text-xl font-medium">Đặt mật khẩu</h1>
        </div>

        {ready ? (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
                Mật khẩu mới
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={10}
                value={password}
                onChange={(e) => setPasswordValue(e.target.value)}
                autoComplete="new-password"
                className="rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
              />
              <p className="text-xs text-ink-2">Ít nhất 10 ký tự, có chữ hoa, chữ thường và số.</p>
              {liveCheck && !liveCheck.valid && <p className="text-xs font-medium text-red-600">{liveCheck.error}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
                Nhập lại mật khẩu
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                className="rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
              />
            </div>
            {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="mt-1 cursor-pointer rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Đang lưu..." : "Lưu mật khẩu"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink-2">{sessionError ?? "Đang xác thực đường dẫn..."}</p>
        )}
      </div>
    </div>
  );
}
