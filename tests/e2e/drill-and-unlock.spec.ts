import { expect, test } from '@playwright/test';

test.describe('US2–US4: First-Person RHD Drills, Silent Parity, Urban Tomare & Unlock Flows', () => {
  test('completes warmup with left-wiper trap, visibilitychange auto-pause, wrong-way intercept, repeat improvement, Fake Door, buddy unlock, and disclosed resources', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/?render=2d');

    // Start Warmup Range directly -> accept disclaimer
    await page.getByTestId('start-warmup-direct-btn').click();
    await page.getByTestId('accept-disclaimer-btn').click();
    await expect(page.getByTestId('drill-container-view')).toBeVisible();

    // Test document.visibilitychange (hidden) automatic pause overlay (FR-010, T054)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.getByTestId('drill-pause-overlay')).toBeVisible();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    });
    await page.getByTestId('resume-drill-btn').click();
    await expect(page.getByTestId('drill-pause-overlay')).toBeHidden();

    // Trigger Left Wiper Stalk Trap -> verify silent-mode visual wiper overlay & amber banner (FR-006, FR-011)
    await page.getByTestId('left-wiper-stalk').click();
    await expect(page.getByTestId('wiper-visual-overlay')).toBeVisible();
    await expect(page.getByTestId('hud-banner-wiper')).toContainText('按到雨刷了');

    // Wait for Warmup Checkpoint 2 (left-turn-small) -> test explicit right-stalk left signal (T053)
    await expect(page.getByTestId('turn-decision-panel')).toBeVisible({ timeout: 12000 });
    await page.getByTestId('right-stalk-left-btn').click();
    await page.getByTestId('turn-left-inbound-btn').click();

    // Wait for Warmup Checkpoint 3 (right-turn-wide) -> test Wrong-Way intercept modal & retry
    await expect(page.getByTestId('turn-decision-panel')).toBeVisible({ timeout: 12000 });
    await page.getByTestId('turn-right-oncoming-btn').click();
    await expect(page.getByTestId('wrong-way-modal')).toBeVisible();
    await page.getByTestId('retry-checkpoint-btn').click();

    // Arm explicit right-stalk right signal (and verify toggle off/on) -> complete into left-inbound
    await page.getByTestId('right-stalk-right-btn').click();
    await page.getByTestId('right-stalk-right-btn').click(); // toggles off
    await page.getByTestId('right-stalk-right-btn').click(); // re-arms right signal
    await page.getByTestId('turn-left-inbound-btn').click();

    // Verify Drill Summary View (Attempt 1 had 2 mistakes: 1 wiper + 1 wrong-way)
    await expect(page.getByTestId('drill-summary-view')).toBeVisible();
    await expect(page.getByTestId('mistake-count-wiper-mistrigger')).toHaveText('1 次');
    await expect(page.getByTestId('mistake-count-wrong-way-lane')).toHaveText('1 次');

    // Verify Disclosed External Travel Resources badge (FR-013)
    await expect(page.getByTestId('resource-disclosure-badge')).toHaveText('合作推薦／外部資源');

    // Test Fake Door zero-charge modal on settlement page (FR-012)
    await page.getByTestId('fake-door-btn-hokkaido-snow-pack').click();
    await expect(page.getByTestId('fake-door-modal')).toContainText('不會收取任何費用');
    await page.getByTestId('close-fake-door-modal-btn').click();

    // Submit 1-question Confidence Pulse (FR-014)
    await page.getByTestId('confidence-opt-much-more-confident').click();
    await expect(page.getByTestId('confidence-saved-msg')).toBeVisible();

    // Replay Warmup Drill cleanly with 0 mistakes to verify Repeat Error Reduction (100% reduction!)
    await page.getByTestId('replay-drill-btn').click();
    await expect(page.getByTestId('turn-decision-panel')).toBeVisible({ timeout: 12000 });
    await page.getByTestId('right-stalk-left-btn').click();
    await page.getByTestId('turn-left-inbound-btn').click();

    await expect(page.getByTestId('turn-decision-panel')).toBeVisible({ timeout: 12000 });
    await page.getByTestId('right-stalk-right-btn').click();
    await page.getByTestId('turn-left-inbound-btn').click();

    await expect(page.getByTestId('drill-summary-view')).toBeVisible();
    await expect(page.getByTestId('repeat-improvement-banner')).toContainText('減少 100%');

    // Unlock Urban Drill 2 via Buddy Share (US4)
    await page.evaluate(() => {
      window.open = () => null;
    });
    await page.getByTestId('unlock-via-line-btn').click();
    await expect(page.getByTestId('play-unlocked-urban2-btn')).toBeVisible();
  });

  test('executes urban-drill-1 verifying 止まれ rolling-stop / full-stop banner, pedestrian yield, and multi-lane arrow right turn (T054)', async ({
    page,
  }) => {
    await page.goto('/?render=2d');
    await page.getByTestId('open-hub-btn').click();
    await page.getByTestId('accept-disclaimer-btn').click();
    await expect(page.getByTestId('scenario-hub-view')).toBeVisible();

    await page.getByTestId('hub-start-urban-drill-1').click();
    await expect(page.getByTestId('drill-container-view')).toBeVisible();

    // Checkpoint 1 (ud1-1-tomare): verify 止まれ timer banner appears within 15m, let rolling-stop violation fire if unbraked
    await expect(page.getByTestId('tomare-timer-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('hud-banner-danger')).toContainText('止まれ未完全靜止', {
      timeout: 8000,
    });

    // Checkpoint 2 (ud1-2-pedestrian-left): wait for decision zone and pedestrian badge to clear, then left turn
    await expect(page.getByTestId('turn-decision-panel')).toBeVisible({ timeout: 12000 });
    await expect(page.getByTestId('hud-pedestrian-badge')).toBeHidden({ timeout: 6000 });
    await page.getByTestId('right-stalk-left-btn').click();
    await page.getByTestId('turn-left-inbound-btn').click();

    // Checkpoint 3 (ud1-3-arrow-right): wait for decision zone and oncoming car badge to clear, then right turn into left-inbound
    await expect(page.getByTestId('turn-decision-panel')).toBeVisible({ timeout: 12000 });
    await expect(page.getByTestId('hud-oncoming-badge')).toBeHidden({ timeout: 6000 });
    await page.getByTestId('right-stalk-right-btn').click();
    await page.getByTestId('turn-left-inbound-btn').click();

    // Verify urban-drill-1 summary records the 1 rolling-stop mistake
    await expect(page.getByTestId('drill-summary-view')).toBeVisible();
    await expect(page.getByTestId('mistake-count-tomare-rolling-stop')).toHaveText('1 次');
  });
});
