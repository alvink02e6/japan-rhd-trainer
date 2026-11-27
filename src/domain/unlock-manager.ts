import type { PackId, ThemePackUnlockState } from './types';

export function applyBuddyShareOutcome(
  current: Record<PackId, ThemePackUnlockState>,
  outcome: { completed: boolean; cancelled?: boolean },
): {
  unlockedNow: boolean;
  nextStates: Record<PackId, ThemePackUnlockState>;
} {
  if (!outcome.completed) {
    return {
      unlockedNow: false,
      nextStates: current,
    };
  }

  const prevUrban2 = current['urban-drill-2'];
  const wasUnlocked = prevUrban2.unlocked;

  return {
    unlockedNow: !wasUnlocked,
    nextStates: {
      ...current,
      'urban-drill-2': {
        ...prevUrban2,
        accessMode: 'share-unlockable',
        unlocked: true,
        intentClickedCount: prevUrban2.intentClickedCount + 1,
      },
    },
  };
}

export function recordFakeDoorIntentClick(
  current: Record<PackId, ThemePackUnlockState>,
  packId: 'hokkaido-snow-pack' | 'highway-etc-pack',
): Record<PackId, ThemePackUnlockState> {
  const target = current[packId];
  return {
    ...current,
    [packId]: {
      ...target,
      accessMode: 'fake-door-preview',
      unlocked: false,
      intentClickedCount: target.intentClickedCount + 1,
    },
  };
}
