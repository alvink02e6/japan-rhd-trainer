import type {
  BrowserEnv,
  RenderMode,
  TelemetryEnvelope,
  TelemetryEventName,
  ViewportClass,
} from '../domain/types';

const EVENT_PROP_ALLOWLIST: Record<TelemetryEventName, readonly string[]> = {
  app_first_interactive: ['loadDurationMs', 'entryRef'],
  disclaimer_accepted: [],
  quiz_started: ['totalQuestions'],
  quiz_completed: ['totalQuestions', 'correctCount', 'durationMs', 'grade'],
  drill_started: ['scenarioId', 'attemptNumber'],
  rule_mistake_logged: ['scenarioId', 'attemptNumber', 'mistakeType'],
  drill_completed: [
    'scenarioId',
    'attemptNumber',
    'durationMs',
    'totalMistakes',
    'errorReductionPctVsFirst',
  ],
  core_loop_completed: ['totalCoreDurationMs'],
  confidence_pulse_submitted: ['rating'],
  diagnostic_shared: ['channel', 'context'],
  buddy_unlock_granted: ['packId'],
  fake_door_clicked: ['packId'],
  affiliate_resource_clicked: ['resourceCategory'],
  render_degraded: ['reason'],
};

export interface TelemetryClientConfig {
  endpoint?: string;
  getSessionId: () => string;
  getBrowserEnv: () => BrowserEnv;
  getViewportClass: () => ViewportClass;
  getRenderMode: () => RenderMode;
  sendBeacon?: (url: string, data?: BodyInit | null) => boolean;
  fetchFn?: typeof fetch;
}

export interface TelemetryClient {
  track(eventName: TelemetryEventName, rawProps?: Record<string, unknown>): TelemetryEnvelope;
  getDebugBuffer(): readonly TelemetryEnvelope[];
}

export function sanitizeEventProps(
  eventName: TelemetryEventName,
  rawProps?: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  const allowedKeys = EVENT_PROP_ALLOWLIST[eventName] ?? [];
  const clean: Record<string, string | number | boolean | null> = {};
  if (!rawProps) return clean;

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(rawProps, key)) {
      const val = rawProps[key];
      if (
        typeof val === 'string' ||
        typeof val === 'number' ||
        typeof val === 'boolean' ||
        val === null
      ) {
        clean[key] = val;
      }
    }
  }
  return clean;
}

export function createTelemetryClient(config: TelemetryClientConfig): TelemetryClient {
  const debugBuffer: TelemetryEnvelope[] = [];
  const maxBuffer = 100;

  return {
    track(eventName: TelemetryEventName, rawProps?: Record<string, unknown>): TelemetryEnvelope {
      const envelope: TelemetryEnvelope = {
        schemaVersion: '1.0',
        sessionId: config.getSessionId(),
        eventName,
        timestampIso: new Date().toISOString(),
        browserEnv: config.getBrowserEnv(),
        viewportClass: config.getViewportClass(),
        renderMode: config.getRenderMode(),
        props: sanitizeEventProps(eventName, rawProps),
      };

      debugBuffer.push(envelope);
      if (debugBuffer.length > maxBuffer) {
        debugBuffer.shift();
      }

      const endpoint = (config.endpoint ?? '').trim();
      if (!endpoint) {
        return envelope;
      }

      const payload = JSON.stringify(envelope);
      const beaconFn =
        config.sendBeacon ??
        (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function'
          ? navigator.sendBeacon.bind(navigator)
          : undefined);

      let sent = false;
      if (beaconFn) {
        try {
          sent = beaconFn(endpoint, payload);
        } catch {
          sent = false;
        }
      }

      if (!sent) {
        const doFetch = config.fetchFn ?? (typeof fetch === 'function' ? fetch : undefined);
        if (doFetch) {
          try {
            void doFetch(endpoint, {
              method: 'POST',
              body: payload,
              keepalive: true,
              headers: { 'Content-Type': 'application/json' },
            }).catch(() => {});
          } catch {
            // Never block UI on telemetry network error
          }
        }
      }

      return envelope;
    },
    getDebugBuffer() {
      return debugBuffer;
    },
  };
}
