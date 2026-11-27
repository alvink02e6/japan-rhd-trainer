import type { AnonymousValidationSession, PackId, ThemePackUnlockState } from '../domain/types';

export const SESSION_STORAGE_KEY = 'jrhd_v1_session';

export interface SafeStorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  isFallbackMemory(): boolean;
}

export function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createDefaultUnlockStates(): Record<PackId, ThemePackUnlockState> {
  return {
    'urban-drill-2': {
      packId: 'urban-drill-2',
      accessMode: 'share-unlockable',
      unlocked: false,
      displayedPriceLabel: null,
      intentClickedCount: 0,
    },
    'hokkaido-snow-pack': {
      packId: 'hokkaido-snow-pack',
      accessMode: 'fake-door-preview',
      unlocked: false,
      displayedPriceLabel: '預計單次通行方案 NT$90',
      intentClickedCount: 0,
    },
    'highway-etc-pack': {
      packId: 'highway-etc-pack',
      accessMode: 'fake-door-preview',
      unlocked: false,
      displayedPriceLabel: '預計單次通行方案 NT$90',
      intentClickedCount: 0,
    },
  };
}

export function createSafeStorage(
  backing?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null,
): SafeStorageAdapter {
  const memory = new Map<string, string>();
  let useMemory = false;

  const resolveBacking = (): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null => {
    if (backing !== undefined) return backing;
    try {
      return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
      useMemory = true;
      return null;
    }
  };

  return {
    getItem(key: string): string | null {
      if (!useMemory) {
        try {
          const target = resolveBacking();
          if (target) return target.getItem(key);
          useMemory = true;
        } catch {
          useMemory = true;
        }
      }
      return memory.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      memory.set(key, value);
      if (!useMemory) {
        try {
          const target = resolveBacking();
          if (target) {
            target.setItem(key, value);
            return;
          }
          useMemory = true;
        } catch {
          useMemory = true;
        }
      }
    },
    removeItem(key: string): void {
      memory.delete(key);
      if (!useMemory) {
        try {
          const target = resolveBacking();
          if (target) target.removeItem(key);
        } catch {
          useMemory = true;
        }
      }
    },
    isFallbackMemory(): boolean {
      return useMemory;
    },
  };
}

export function loadOrCreateSession(
  storage: SafeStorageAdapter,
  initialEntryRef: 'direct' | 'buddy-share' = 'direct',
): AnonymousValidationSession {
  const raw = storage.getItem(SESSION_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<AnonymousValidationSession>;
      if (parsed && typeof parsed.sessionId === 'string') {
        const defaults = createDefaultUnlockStates();
        return {
          sessionId: parsed.sessionId,
          disclaimerAcceptedAt:
            typeof parsed.disclaimerAcceptedAt === 'string' ? parsed.disclaimerAcceptedAt : null,
          entryRef: parsed.entryRef === 'buddy-share' ? 'buddy-share' : 'direct',
          quizResult: parsed.quizResult ?? null,
          drillAttempts: Array.isArray(parsed.drillAttempts) ? parsed.drillAttempts : [],
          confidencePulse: parsed.confidencePulse ?? null,
          unlockStates: {
            'urban-drill-2': {
              ...defaults['urban-drill-2'],
              ...(parsed.unlockStates?.['urban-drill-2'] ?? {}),
              accessMode: 'share-unlockable',
            },
            'hokkaido-snow-pack': {
              ...defaults['hokkaido-snow-pack'],
              ...(parsed.unlockStates?.['hokkaido-snow-pack'] ?? {}),
              accessMode: 'fake-door-preview',
              unlocked: false,
            },
            'highway-etc-pack': {
              ...defaults['highway-etc-pack'],
              ...(parsed.unlockStates?.['highway-etc-pack'] ?? {}),
              accessMode: 'fake-door-preview',
              unlocked: false,
            },
          },
        };
      }
    } catch {
      // Corrupted JSON falls through to fresh session creation
    }
  }

  const fresh: AnonymousValidationSession = {
    sessionId: generateUuidV4(),
    disclaimerAcceptedAt: null,
    entryRef: initialEntryRef,
    quizResult: null,
    drillAttempts: [],
    confidencePulse: null,
    unlockStates: createDefaultUnlockStates(),
  };
  saveSession(storage, fresh);
  return fresh;
}

export function saveSession(storage: SafeStorageAdapter, session: AnonymousValidationSession): void {
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}
