"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Thẻ cào minh hoạ ở hero. Lớp "bạc" là một <canvas> phủ lên nội dung thật —
// cào = xoá pixel bằng destination-out. Nội dung giải thưởng bên dưới là DOM
// thật (không vẽ vào canvas) nên trình đọc màn hình và SEO vẫn đọc được đầy đủ
// kể cả khi chưa cào; canvas được aria-hidden vì nó thuần trang trí.
//
// Ngưỡng 42%: cào tay thật hiếm khi vượt quá ~60% trước khi người dùng chán,
// nên tự động hé lộ nốt phần còn lại thay vì bắt cào kín mặt thẻ.
const REVEAL_THRESHOLD = 0.42;
// Lấy mẫu cách 4 pixel khi đo diện tích đã cào — đủ chính xác cho một ngưỡng
// phần trăm, mà rẻ hơn 16 lần so với quét từng pixel trên mỗi lần nhấc tay.
const SAMPLE_STEP = 4;

export function ScratchCard({
  amountLabel,
  codeLabel,
  brandLabel,
  scratchLabel,
  hint,
  revealedNote,
  againLabel,
  demoLabel,
}: {
  amountLabel: string;
  codeLabel: string;
  brandLabel: string;
  scratchLabel: string;
  hint: string;
  revealedNote: string;
  againLabel: string;
  demoLabel: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [revealed, setRevealed] = useState(false);

  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, rect.width, rect.height);

    const foil = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    foil.addColorStop(0, "#c8cfd8");
    foil.addColorStop(0.28, "#eef2f6");
    foil.addColorStop(0.46, "#aab4c0");
    foil.addColorStop(0.62, "#e4e9ef");
    foil.addColorStop(0.84, "#b2bcc8");
    foil.addColorStop(1, "#d6dce3");
    ctx.fillStyle = foil;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Vệt sọc chéo rất mờ — làm bề mặt trông như giấy foil in thật chứ không
    // phải một mảng gradient phẳng.
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    for (let x = -rect.height; x < rect.width; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, rect.height);
      ctx.lineTo(x + rect.height, 0);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(22,33,62,0.42)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 13px Inter, system-ui, sans-serif";
    ctx.letterSpacing = "0.22em";
    ctx.fillText(scratchLabel.toUpperCase(), rect.width / 2, rect.height / 2);
  }, [scratchLabel]);

  // Đọc trong callback của ResizeObserver, nên phải là ref chứ không phải state:
  // nếu để `revealed` vào deps của effect bên dưới thì mỗi lần hé lộ, effect
  // chạy lại và paintFoil() vẽ đè lớp bạc lên kết quả vừa cào xong.
  const revealedRef = useRef(false);
  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  // Vẽ lại (hoặc xoá sạch) lớp bạc mỗi khi trạng thái hé lộ đổi — bao gồm cả
  // lần mount đầu. Làm đồng bộ ngay trong effect thay vì qua requestAnimation-
  // Frame: rAF bị treo khi tab không được vẽ, khi đó nút "Cào lại" im lặng
  // không có tác dụng gì. Xoá hẳn pixel thay vì chỉ hạ opacity bằng CSS vì
  // opacity không phải lúc nào cũng áp dụng được lên <canvas>.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!revealed) {
      paintFoil();
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [revealed, paintFoil]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Mặt thẻ co theo bề ngang màn hình; không vẽ lại thì foil bị kéo giãn mờ.
    const observer = new ResizeObserver(() => {
      if (!revealedRef.current) paintFoil();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [paintFoil]);

  const measureScratched = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return 0;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * SAMPLE_STEP) {
      total++;
      if (data[i] < 24) clear++;
    }
    return total === 0 ? 0 : clear / total;
  }, []);

  const scratchTo = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 34;
    const last = lastPointRef.current;
    ctx.beginPath();
    // Nối từ điểm trước tới điểm hiện tại: chỉ chấm từng điểm rời sẽ để lại
    // vệt đứt quãng khi người dùng quét tay nhanh.
    ctx.moveTo(last ? last.x : x, last ? last.y : y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
  }, []);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (revealed) return;
    // Giữ con trỏ để nét cào không đứt khi tay đi ra ngoài mép thẻ rồi quay
    // lại. Bọc try/catch vì setPointerCapture ném lỗi nếu pointerId không còn
    // active (xảy ra với sự kiện tổng hợp và vài trình duyệt khi nhả tay sớm)
    // — mất capture chỉ làm nét cào kém mượt, không đáng để chặn cả thao tác.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* không sao — vẫn cào được, chỉ là không giữ được con trỏ */
    }
    drawingRef.current = true;
    const { x, y } = pointFromEvent(e);
    lastPointRef.current = null;
    scratchTo(x, y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || revealed) return;
    const { x, y } = pointFromEvent(e);
    scratchTo(x, y);
  };

  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    if (measureScratched() >= REVEAL_THRESHOLD) setRevealed(true);
  };

  const reset = () => {
    lastPointRef.current = null;
    setRevealed(false); // effect bên dưới lo việc vẽ lại lớp bạc
  };

  return (
    <div className="flex w-full max-w-[380px] flex-col items-center gap-4">
      <div className="relative w-full overflow-hidden rounded-[28px] border border-white/15 bg-[#0e1730] shadow-[0_30px_70px_rgba(4,10,26,0.55)]">
        <span className="absolute top-4 left-4 z-20 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/70 uppercase backdrop-blur-sm">
          {demoLabel}
        </span>

        <div className="flex aspect-[7/5] flex-col items-center justify-center gap-2.5 px-7 text-center">
          <span className="text-[11px] font-semibold tracking-[0.26em] text-white/45 uppercase">
            {brandLabel}
          </span>
          <span className="bg-gradient-to-br from-white via-[#bcdcff] to-[#f88aaf] bg-clip-text text-[clamp(38px,9vw,52px)] leading-none font-semibold tracking-[-0.03em] text-transparent">
            {amountLabel}
          </span>
          <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[12px] tracking-[0.18em] text-white/60">
            {codeLabel}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
          className={`absolute inset-0 z-10 h-full w-full touch-none transition-opacity duration-500 ease-soft ${
            revealed ? "pointer-events-none opacity-0" : "cursor-grab opacity-100 active:cursor-grabbing"
          }`}
        />
      </div>

      {revealed ? (
        <div className="flex flex-col items-center gap-2.5">
          <p className="text-center text-[13px] leading-relaxed text-white/60">{revealedNote}</p>
          <button
            type="button"
            onClick={reset}
            className="cursor-pointer rounded-full border border-white/25 px-4 py-2 text-[13px] font-semibold text-white/85 transition-colors duration-200 hover:border-white/60 hover:bg-white/10"
          >
            {againLabel}
          </button>
        </div>
      ) : (
        <p className="text-center text-[13px] text-white/50">{hint}</p>
      )}
    </div>
  );
}
