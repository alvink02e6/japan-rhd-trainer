import { describe, expect, it, vi } from 'vitest';
import { createSafeStorage, loadOrCreateSession, saveSession } from '../../src/platform/safe-storage';
import { createTelemetryClient } from '../../src/telemetry/telemetry-client';

describe('SafeStorage & AnonymousValidationSession persistence', () => {
  it('persists and reloads jrhd_v1_session when localStorage is available', () => {
    const backing = new Map<string, string>();
    const mockStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
      getItem: (k) => backing.get(k) ?? null,
      setItem: (k, v) => {
        backing.set(k, v);
      },
      removeItem: (k) => {
        backing.delete(k);
      },
    };

    const store = createSafeStorage(mockStorage);
    const session = loadOrCreateSession(store, 'buddy-share');
    expect(session.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(session.entryRef).toBe('buddy-share');
    expect(session.disclaimerAcceptedAt).toBeNull();
    expect(session.unlockStates['urban-drill-2'].unlocked).toBe(false);
    expect(session.unlockStates['hokkaido-snow-pack'].accessMode).toBe('fake-door-preview');

    session.disclaimerAcceptedAt = '2026-11-27T03:00:00.000Z';
    saveSession(store, session);

    const reloaded = loadOrCreateSession(store, 'direct');
    expect(reloaded.sessionId).toBe(session.sessionId);
    expect(reloaded.disclaimerAcceptedAt).toBe('2026-11-27T03:00:00.000Z');
    expect(reloaded.entryRef).toBe('buddy-share');
  });

  it('falls back seamlessly to in-memory Map when localStorage throws in private/IAB mode', () => {
    const throwingStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
      getItem: () => {
        throw new DOMException('Blocked', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      },
      removeItem: () => {
        throw new DOMException('Blocked', 'SecurityError');
      },
    };

    const store = createSafeStorage(throwingStorage);
    expect(store.isFallbackMemory()).toBe(false);

    const session = loadOrCreateSession(store, 'direct');
    expect(store.isFallbackMemory()).toBe(true);
    session.confidencePulse = 'much-more-confident';
    expect(() => saveSession(store, session)).not.toThrow();

    const readBack = loadOrCreateSession(store, 'direct');
    expect(readBack.confidencePulse).toBe('much-more-confident');
  });
});

describe('Zero-PII TelemetryClient allowlist & transport', () => {
  it('strips all un-allowlisted / PII fields before serialization and sends via sendBeacon', () => {
    const sendBeacon = vi.fn(() => true);
    const fetchFn = vi.fn();

    const client = createTelemetryClient({
      endpoint: 'https://telemetry.example.invalid/collect',
      getSessionId: () => '550e8400-e29b-41d4-a716-446655440000',
      getBrowserEnv: () => 'line-iab',
      getViewportClass: () => 'standard',
      getRenderMode: () => 'webgl2',
      sendBeacon,
      fetchFn,
    });

    client.track('drill_completed', {
      scenarioId: 'urban-drill-1',
      attemptNumber: 2,
      durationMs: 64000,
      totalMistakes: 1,
      errorReductionPctVsFirst: 67,
      // Unauthorized / PII fields that MUST be stripped:
      email: 'traveler@example.com',
      fullName: 'Alvin',
      phone: '+886912345678',
      rawUserAgent: 'Mozilla/5.0 Line/14.5.0',
      gpsLat: 26.2124,
      freeTextComment: 'secret note',
    });

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(fetchFn).not.toHaveBeenCalled();

    const [, body] = sendBeacon.mock.calls[0] as unknown as [string, string];
    const parsed = JSON.parse(body);

    expect(parsed.schemaVersion).toBe('1.0');
    expect(parsed.browserEnv).toBe('line-iab');
    expect(parsed.props).toEqual({
      scenarioId: 'urban-drill-1',
      attemptNumber: 2,
      durationMs: 64000,
      totalMistakes: 1,
      errorReductionPctVsFirst: 67,
    });
    expect(body).not.toContain('traveler@example.com');
    expect(body).not.toContain('Alvin');
    expect(body).not.toContain('+886912345678');
    expect(body).not.toContain('Mozilla/5.0');
    expect(body).not.toContain('secret note');
  });

  it('falls back to fetch keepalive when sendBeacon returns false, and stores locally when no endpoint configured', () => {
    const sendBeacon = vi.fn(() => false);
    const fetchFn = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));

    const clientWithEndpoint = createTelemetryClient({
      endpoint: 'https://telemetry.example.invalid/collect',
      getSessionId: () => '550e8400-e29b-41d4-a716-446655440000',
      getBrowserEnv: () => 'fb-iab',
      getViewportClass: () => 'compact',
      getRenderMode: () => 'fallback-2d',
      sendBeacon,
      fetchFn,
    });

    clientWithEndpoint.track('fake_door_clicked', { packId: 'hokkaido-snow-pack' });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    const localOnlyClient = createTelemetryClient({
      endpoint: '',
      getSessionId: () => '550e8400-e29b-41d4-a716-446655440000',
      getBrowserEnv: () => 'safari',
      getViewportClass: () => 'standard',
      getRenderMode: () => 'webgl2',
    });

    expect(() =>
      localOnlyClient.track('app_first_interactive', { loadDurationMs: 420, entryRef: 'direct' }),
    ).not.toThrow();
    expect(localOnlyClient.getDebugBuffer()).toHaveLength(1);
  });
});
