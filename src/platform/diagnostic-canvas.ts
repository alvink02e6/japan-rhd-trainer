import type { ReadinessDiagnosticCard } from '../domain/types';

const GRADE_COLORS: Record<ReadinessDiagnosticCard['grade'], string> = {
  S: '#22c55e',
  A: '#38bdf8',
  B: '#f59e0b',
  C: '#ef4444',
};

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const chars = Array.from(text);
  const lines: string[] = [];
  let current = '';
  for (const ch of chars) {
    const next = current + ch;
    if (ctx.measureText(next).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = ch;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildSvgFallbackDataUrl(card: ReadinessDiagnosticCard): string {
  const color = GRADE_COLORS[card.grade];
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const spots = card.topBlindSpots
    .map(
      (b, idx) =>
        `<text x="48" y="${430 + idx * 56}" fill="#e2e8f0" font-size="22" font-family="sans-serif">• ${esc(b.slice(0, 30))}</text>`,
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
    <rect width="720" height="720" rx="32" fill="#0f172a"/>
    <rect x="24" y="24" width="672" height="672" rx="24" fill="#1e293b" stroke="${color}" stroke-width="4"/>
    <text x="48" y="88" fill="#94a3b8" font-size="24" font-weight="bold" font-family="sans-serif">日本右駕行前存活／翻車診斷卡</text>
    <circle cx="590" cy="140" r="68" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="5"/>
    <text x="590" y="164" text-anchor="middle" fill="${color}" font-size="72" font-weight="bold" font-family="sans-serif">${esc(card.grade)}</text>
    <text x="48" y="160" fill="#f8fafc" font-size="30" font-weight="bold" font-family="sans-serif">${esc(card.headline.slice(0, 18))}</text>
    <text x="48" y="215" fill="#38bdf8" font-size="26" font-weight="bold" font-family="sans-serif">台日差異號誌測驗：${esc(card.quizScoreText)}</text>
    <text x="48" y="375" fill="#fbbf24" font-size="24" font-weight="bold" font-family="sans-serif">行前重點盲點提醒：</text>
    ${spots}
    <text x="48" y="655" fill="#94a3b8" font-size="20" font-family="sans-serif">記住口訣：靠左開・左小彎・右大彎・右手打方向燈</text>
  </svg>`;

  const encoded =
    typeof btoa === 'function'
      ? btoa(unescape(encodeURIComponent(svg)))
      : encodeURIComponent(svg);
  return typeof btoa === 'function'
    ? `data:image/svg+xml;base64,${encoded}`
    : `data:image/svg+xml;utf8,${encoded}`;
}

export function renderDiagnosticCardDataUrl(card: ReadinessDiagnosticCard): string {
  if (typeof document === 'undefined') {
    return buildSvgFallbackDataUrl(card);
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 840;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return buildSvgFallbackDataUrl(card);
    }

    const accent = GRADE_COLORS[card.grade];

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.fillRect(24, 24, 672, 792);
    ctx.strokeRect(24, 24, 672, 792);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('JAPAN RHD PRE-TRIP DIAGNOSTIC', 52, 78);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px sans-serif';
    const titleLines = wrapCanvasText(ctx, card.headline, 430);
    titleLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, 52, 134 + idx * 44);
    });

    ctx.beginPath();
    ctx.arc(592, 140, 68, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = accent;
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = 'bold 76px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.grade, 592, 166);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`台日差異號誌成績：${card.quizScoreText}`, 52, 255);

    if (card.improvementBadge) {
      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`★ ${card.improvementBadge}`, 52, 298);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(52, 330);
    ctx.lineTo(668, 330);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('你的行前重點提醒（日本右駕保命守則）：', 52, 378);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '24px sans-serif';
    let cursorY = 428;
    for (const spot of card.topBlindSpots) {
      const wrapped = wrapCanvasText(ctx, `• ${spot}`, 600);
      for (const line of wrapped) {
        ctx.fillText(line, 52, cursorY);
        cursorY += 36;
      }
      cursorY += 14;
    }

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(52, 712, 616, 68);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 23px sans-serif';
    ctx.fillText('口訣：靠左行駛・左轉小彎・右轉大彎・右手打方向燈', 76, 754);

    const url = canvas.toDataURL('image/png');
    if (!url || !url.startsWith('data:image/')) {
      return buildSvgFallbackDataUrl(card);
    }
    return url;
  } catch {
    return buildSvgFallbackDataUrl(card);
  }
}
