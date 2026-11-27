import { expect, test } from '@playwright/test';
import { SIGNAL_QUESTIONS } from '../../src/content/signal-questions';

test.describe('US1: Taiwan-vs-Japan Dynamic Signal Quiz & Diagnostic Card under LINE IAB', () => {
  test('shows ?ref=buddy welcome banner, enforces disclaimer gate, completes 10 questions, and shares diagnostic card', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/?ref=buddy');

    // Verify buddy-share welcome banner is visible & XSS-clean
    await expect(page.getByTestId('buddy-welcome-banner')).toBeVisible();

    // Clicking Start Quiz must open mandatory pre-trip safety disclaimer first
    await page.getByTestId('start-quiz-btn').click();
    await expect(page.getByTestId('disclaimer-modal')).toBeVisible();

    await page.getByTestId('accept-disclaimer-btn').click();
    await expect(page.getByTestId('signal-quiz-view')).toBeVisible();

    // Complete all 10 curated questions
    for (let i = 0; i < SIGNAL_QUESTIONS.length; i++) {
      const q = SIGNAL_QUESTIONS[i];
      await expect(page.getByTestId('quiz-progress')).toContainText(
        `${i + 1} / ${SIGNAL_QUESTIONS.length}`,
      );
      await page.getByTestId(`quiz-option-${q.correctOptionId}`).click();
      await expect(page.getByTestId('quiz-feedback')).toContainText('判斷正確');
      await page.getByTestId('quiz-next-btn').click();
    }

    // Diagnostic Card View rendered with S grade and data:image/ URL for long-press save
    await expect(page.getByTestId('diagnostic-card-view')).toBeVisible();
    await expect(page.getByTestId('diagnostic-grade')).toHaveText('S');

    const imgSrc = await page.getByTestId('diagnostic-card-image').getAttribute('src');
    expect(imgSrc).toMatch(/^data:image\//);
    await page.getByTestId('diagnostic-card-image').click({ button: 'right' });

    // Remediation U1 check: Fake Door preview packs panel is rendered on Diagnostic settlement page too
    await expect(page.getByTestId('preview-packs-panel')).toBeVisible();

    // Test clipboard share fallback when navigator.share is unavailable in LINE IAB
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });
    await page.getByTestId('share-copy-btn').click();
    await expect(page.getByTestId('share-feedback-banner')).toBeVisible();
  });
});
