import { render } from 'preact';
import './styles/global.css';
import { App } from './ui/App';
import { initAppHeightSync } from './platform/viewport-guard';
import {
  detectBrowserEnv,
  detectViewportClass,
  parseWhitelistedEntryRef,
} from './platform/iab-detect';
import { createSafeStorage, loadOrCreateSession } from './platform/safe-storage';
import { createTelemetryClient } from './telemetry/telemetry-client';
import type { RenderMode } from './domain/types';

const bootStartMs = typeof performance !== 'undefined' ? performance.now() : Date.now();

initAppHeightSync();

const storage = createSafeStorage();
const initialEntryRef = parseWhitelistedEntryRef();
const initialSession = loadOrCreateSession(storage, initialEntryRef);

let activeRenderMode: RenderMode = 'webgl2';
export function setGlobalRenderMode(mode: RenderMode): void {
  activeRenderMode = mode;
}

const telemetryEndpoint =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_TELEMETRY_ENDPOINT ?? '';

const telemetry = createTelemetryClient({
  endpoint: telemetryEndpoint,
  getSessionId: () => initialSession.sessionId,
  getBrowserEnv: () => detectBrowserEnv(),
  getViewportClass: () => detectViewportClass(),
  getRenderMode: () => activeRenderMode,
});

const mountEl = document.getElementById('app');
if (mountEl) {
  render(
    <App
      storage={storage}
      initialSession={initialSession}
      urlEntryRef={initialEntryRef}
      telemetry={telemetry}
      onRenderModeChange={setGlobalRenderMode}
    />,
    mountEl,
  );

  const loadDurationMs = Math.max(
    1,
    Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - bootStartMs),
  );
  telemetry.track('app_first_interactive', {
    loadDurationMs,
    entryRef: initialEntryRef,
  });
}
