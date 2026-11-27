import type { TelemetryClient } from '../telemetry/telemetry-client';

export type ShareContext = 'diagnostic-card' | 'buddy-unlock';
export type ShareOutcome =
  | { completed: true; channel: 'line-url' | 'web-share' | 'clipboard'; message: string }
  | { completed: false; cancelled: boolean; message: string };

export function buildLineShareUrl(shareText: string): string {
  return `https://line.me/R/share?text=${encodeURIComponent(shareText)}`;
}

async function copyTextFallback(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand fallback for restricted WebViews
    }
  }

  if (typeof document === 'undefined') return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', 'true');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function triggerLineGroupShare(
  shareText: string,
  context: ShareContext,
  telemetry: TelemetryClient,
  openFn?: (url: string) => void,
): ShareOutcome {
  const lineUrl = buildLineShareUrl(shareText);
  if (openFn) {
    openFn(lineUrl);
  } else if (typeof window !== 'undefined') {
    window.open(lineUrl, '_blank', 'noopener,noreferrer');
  }

  telemetry.track('diagnostic_shared', { channel: 'line-url', context });
  return {
    completed: true,
    channel: 'line-url',
    message: '已開啟 LINE 分享視窗！快傳給同行的駕駛與副駕一起測驗吧！',
  };
}

export async function triggerSystemOrClipboardShare(
  title: string,
  shareText: string,
  context: ShareContext,
  telemetry: TelemetryClient,
): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: shareText });
      telemetry.track('diagnostic_shared', { channel: 'web-share', context });
      return {
        completed: true,
        channel: 'web-share',
        message: '分享成功！祝你們赴日自駕一路平安順暢！',
      };
    } catch (err) {
      const errorName = err instanceof Error ? err.name : '';
      if (errorName === 'AbortError') {
        return {
          completed: false,
          cancelled: true,
          message: '已取消分享（完成分享即可免費解鎖獎勵關卡）。',
        };
      }
      // In LINE / Facebook IAB, navigator.share often throws NotAllowedError or TypeError -> seamless clipboard fallback
    }
  }

  const copied = await copyTextFallback(shareText);
  if (copied) {
    telemetry.track('diagnostic_shared', { channel: 'clipboard', context });
    return {
      completed: true,
      channel: 'clipboard',
      message: '挑戰文案與連結已複製！請直接貼到旅遊群組挑戰同行旅伴。',
    };
  }

  return {
    completed: false,
    cancelled: false,
    message: '無法自動複製，請手動長按上方診斷卡圖片儲存分享。',
  };
}
