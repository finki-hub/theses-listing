import { expect, type Page, test } from '@playwright/test';

import { createLongCatalog, mockCatalogs, useEnglish } from './fixtures';

const ANA = 'Ana Petrovska';
const MARKO = 'Marko Nikolov';
const MASTERS_TAB = 'Master’s theses';

const EXPANDED_MENTOR_URL = /mentor=Ana\+Petrovska/u;
const SEARCH_URL = /q=lossless/u;
const CANCELLED_CHIP = /Cancelled/u;
const CANCELLED_URL = /status=tone%3Acancelled/u;
const MASTERS_URL = /\/masters\?q=medical/u;
const YEAR_URL = /year=2019/u;
const IN_PROGRESS_URL = /sort=inProgress/u;
const MENTOR_NAME = /Ana Petrovska|Marko Nikolov/u;

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

test('keeps navigation in reach in a long list', async ({ isMobile, page }) => {
  await mockCatalogs(page, { diplomas: createLongCatalog(80) });
  await page.goto('/');
  await expect(mentorButton(page, 'Mentor 080')).toBeAttached();

  const backToTop = page.getByRole('button', { name: 'Back to top' });
  await expect(backToTop).toBeHidden();

  await page.evaluate(() => {
    scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect(backToTop).toBeVisible();

  // The desktop table header sticks to the top of the viewport.
  if (!isMobile) {
    const header = await page.locator('thead').first().boundingBox();
    expect(header?.y).toBe(0);
  }

  await backToTop.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(backToTop).toBeHidden();
});

test('filters by a year from the chart and profiles a mentor', async ({
  page,
}) => {
  await mockCatalogs(page, { diplomas: createLongCatalog(10) });
  await page.goto('/');

  const chartToggle = page.getByRole('button', { name: 'Theses per year' });
  // Phones start with the chart collapsed.
  if ((await chartToggle.getAttribute('aria-expanded')) === 'false')
    await chartToggle.click();

  const bar = page.getByRole('button', { name: '2019: 2' });
  await bar.click();

  await expect(bar).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(YEAR_URL);
  await expect(mentorButton(page, 'Mentor 002')).toBeVisible();
  await expect(mentorButton(page, 'Mentor 001')).toHaveCount(0);

  await mentorButton(page, 'Mentor 002').click();
  await expect(page.getByText('All theses: 1')).toBeVisible();
  await expect(page.getByText('Busiest year: 2019 (1)')).toBeVisible();
});

test('sorts by current workload and shows committee work', async ({
  isMobile,
  page,
}) => {
  await mockCatalogs(page);
  // Reverse name order puts Marko first; Ana has the thesis in progress.
  await page.goto('/?sort=mentor&dir=desc');
  await expect(
    page.getByRole('button', { name: MENTOR_NAME }).first(),
  ).toContainText(MARKO);

  // Phones sort with chips; wider screens with the column header.
  await (
    isMobile
      ? page.getByRole('button', { exact: true, name: 'Active' })
      : page
          .getByRole('columnheader', { name: 'In progress' })
          .getByRole('button')
  ).click();

  await expect(page).toHaveURL(IN_PROGRESS_URL);
  const mentors = page.getByRole('button', { name: MENTOR_NAME });
  await expect(mentors.first()).toContainText(ANA);

  await mentorButton(page, ANA).click();
  await expect(page.getByText('On committees: 1')).toBeVisible();
});
