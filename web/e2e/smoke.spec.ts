import { expect, type Page, test } from '@playwright/test';

import { mockCatalogs, useEnglish } from './fixtures';

const ANA = 'Ana Petrovska';
const MARKO = 'Marko Nikolov';
const MASTERS_TAB = 'Master’s theses';

const EXPANDED_MENTOR_URL = /mentor=Ana\+Petrovska/u;
const SEARCH_URL = /q=lossless/u;
const CANCELLED_CHIP = /Cancelled/u;
const CANCELLED_URL = /status=tone%3Acancelled/u;
const MASTERS_URL = /\/masters\?q=medical/u;

// Names are matched as substrings, so rank prefixes and counts don't matter.
const mentorButton = (page: Page, name: string) =>
  page.getByRole('button', { name });

const expectNoHorizontalScroll = async (page: Page) => {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
};

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

test('lists mentors and expands one into its theses', async ({ page }) => {
  await mockCatalogs(page);
  await page.goto('/');

  await expect(mentorButton(page, ANA)).toBeVisible();
  await expect(mentorButton(page, MARKO)).toBeVisible();
  await expectNoHorizontalScroll(page);

  await mentorButton(page, ANA).click();

  await expect(mentorButton(page, ANA)).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(
    page.getByText('Path planning for warehouse robots'),
  ).toBeVisible();
  await expect(page).toHaveURL(EXPANDED_MENTOR_URL);
  await expectNoHorizontalScroll(page);
});

test('searches theses and clears the search', async ({ page }) => {
  await mockCatalogs(page);
  await page.goto('/');

  const search = page.getByRole('searchbox');
  await search.fill('lossless');

  await expect(page).toHaveURL(SEARCH_URL);
  await expect(mentorButton(page, ANA)).toHaveCount(0);
  // A narrow search opens the matching mentors on its own.
  await expect(
    page.getByText('Comparing lossless compression codecs'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Clear search' }).click();

  await expect(search).toHaveValue('');
  await expect(mentorButton(page, ANA)).toBeVisible();
});

test('filters by state and clears the filters', async ({ page }) => {
  await mockCatalogs(page);
  await page.goto('/');

  const cancelled = page.getByRole('button', { name: CANCELLED_CHIP });
  await cancelled.click();

  await expect(cancelled).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(CANCELLED_URL);
  await expect(mentorButton(page, MARKO)).toBeVisible();
  await expect(mentorButton(page, ANA)).toHaveCount(0);

  await page.getByRole('button', { name: 'Clear filters' }).first().click();

  await expect(cancelled).toHaveAttribute('aria-pressed', 'false');
  await expect(mentorButton(page, ANA)).toBeVisible();
});

test('switches to master’s theses and keeps the search', async ({ page }) => {
  await mockCatalogs(page);
  await page.goto('/?q=medical');

  await page.getByRole('link', { name: MASTERS_TAB }).click();

  await expect(page).toHaveURL(MASTERS_URL);
  await expect(page.getByRole('link', { name: MASTERS_TAB })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(
    page.getByText('Language models for medical records'),
  ).toBeVisible();
  await expect(page.getByText('Step 13 of 24').first()).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test('recovers from a failed load with Try again', async ({ page }) => {
  await mockCatalogs(page, { failDiplomasOnce: true });
  await page.goto('/');

  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Could not load the data');

  await alert.getByRole('button', { name: 'Try again' }).click();

  await expect(alert).toHaveCount(0);
  await expect(mentorButton(page, ANA)).toBeVisible();
});
