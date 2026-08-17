"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
      if (!data.session) setError("Đường dẫn không hợp lệ hoặc đã hết hạn. Hãy xin quản trị viên gửi lời mời lại.");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Mật khẩu cần ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirm) {
      setError("Hai mật khẩu không khớp.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError("Không đặt được mật khẩu: " + updateError.message);
      return;
    }

    router.replace("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-[380px] flex-col gap-4 rounded-card border border-line bg-card p-8 shadow-[0_10px_30px_rgba(22,33,62,0.08)]">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-accent">SAIZA</span>
          <h1 className="text-xl font-medium">Đặt mật khẩu</h1>
        </div>

        {ready ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
                Mật khẩu mới
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
                Nhập lại mật khẩu
              </label>
              <input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
              />
            </div>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-1 cursor-pointer rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : "Lưu mật khẩu"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink-2">{error ?? "Đang xác thực đường dẫn..."}</p>
        )}
      </div>
    </div>
  );
}
