import { describe, expect, it } from 'vitest';
import { createDefaultUnlockStates } from '../../src/platform/safe-storage';
import {
  applyBuddyShareOutcome,
  recordFakeDoorIntentClick,
} from '../../src/domain/unlock-manager';

describe('ThemePackUnlockState & Buddy-Share / Fake Door Rules (US4)', () => {
  it('unlocks urban-drill-2 on completed share, but keeps it locked on AbortError cancellation', () => {
    const initial = createDefaultUnlockStates();
    expect(initial['urban-drill-2'].unlocked).toBe(false);

    // Cancelled share (AbortError -> completed: false) MUST NOT grant unlock
    const afterCancel = applyBuddyShareOutcome(initial, { completed: false, cancelled: true });
    expect(afterCancel.unlockedNow).toBe(false);
    expect(afterCancel.nextStates['urban-drill-2'].unlocked).toBe(false);

    // Completed share (LINE URL / Web Share / Clipboard) grants unlock
    const afterShare = applyBuddyShareOutcome(initial, { completed: true });
    expect(afterShare.unlockedNow).toBe(true);
    expect(afterShare.nextStates['urban-drill-2'].unlocked).toBe(true);
    expect(afterShare.nextStates['urban-drill-2'].intentClickedCount).toBe(1);
  });

  it('keeps fake-door-preview packs (hokkaido-snow-pack, highway-etc-pack) unlocked: false while incrementing intentClickedCount', () => {
    const initial = createDefaultUnlockStates();

    const step1 = recordFakeDoorIntentClick(initial, 'hokkaido-snow-pack');
    expect(step1['hokkaido-snow-pack'].unlocked).toBe(false);
    expect(step1['hokkaido-snow-pack'].intentClickedCount).toBe(1);

    const step2 = recordFakeDoorIntentClick(step1, 'highway-etc-pack');
    expect(step2['highway-etc-pack'].unlocked).toBe(false);
    expect(step2['highway-etc-pack'].intentClickedCount).toBe(1);
  });
});
