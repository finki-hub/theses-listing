import type { Page } from '@playwright/test';
import type { z } from 'zod';

import type { Diploma, masterThesisSchema } from '../src/types';

import {
  DIPLOMAS_LIST_URL,
  MASTERS_LIST_URL,
} from '../src/features/mentors/constants';

// Small, made-up catalogs: enough to exercise search, the state filter,
// expansion and both sections without depending on the live APIs.
const robotsThesis: Diploma = {
  dateOfSubmission: '12.03.2025',
  description: 'A study of path planning for warehouse robots.',
  fileId: 'file-1',
  member1: 'Elena Trajkovska',
  member2: 'Goran Iliev',
  mentor: 'Ana Petrovska',
  status: 'Одбрана',
  student: 'Ivan Stojanov',
  title: 'Path planning for warehouse robots',
};

export const diplomas: Diploma[] = [
  robotsThesis,
  {
    dateOfSubmission: '02.10.2026',
    description: 'A mobile app for planning trips.',
    fileId: null,
    member1: 'Elena Trajkovska',
    member2: 'Goran Iliev',
    mentor: 'Ana Petrovska',
    status: 'Пријава',
    student: 'Maja Kostova',
    title: 'Trip planner for mobile devices',
  },
  {
    dateOfSubmission: '15.05.2026',
    description: 'Comparing compression codecs.',
    fileId: null,
    member1: 'Ana Petrovska',
    member2: 'Goran Iliev',
    mentor: 'Marko Nikolov',
    status: 'Откажана',
    student: 'Petar Ristov',
    title: 'Comparing lossless compression codecs',
  },
];

export const masters: Array<z.infer<typeof masterThesisSchema>> = [
  {
    dateOfPresentation: '11.11.2026',
    description: 'Language models for medical text.',
    fileId: null,
    member: 'Goran Iliev',
    mentor: 'Elena Trajkovska',
    president: 'Ana Petrovska',
    status: '13. Додавање точка за ННС за предлог на комисија.',
    student: 'Sara Velkova',
    title: 'Language models for medical records',
  },
];

const jsonResponse = (body: unknown) => ({
  body: JSON.stringify(body),
  contentType: 'application/json',
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'X-Data-Updated-At, X-Data-Stale',
    'X-Data-Updated-At': '2026-11-20T08:00:00.000Z',
  },
  status: 200,
});

// Enough mentors for the list to span several screens.
export const createLongCatalog = (mentors: number): Diploma[] =>
  Array.from({ length: mentors }, (_, index) => ({
    ...robotsThesis,
    // Spread over five years, so the per-year chart has something to show.
    dateOfSubmission: `01.06.${2_018 + (index % 5)}`,
    mentor: `Mentor ${String(index + 1).padStart(3, '0')}`,
    title: `Thesis ${index + 1}`,
  }));

export const mockCatalogs = async (
  page: Page,
  options: {
    diplomas?: Diploma[];
    failDiplomasOnce?: boolean;
    masters?: typeof masters;
  } = {},
) => {
  const diplomaCatalog = options.diplomas ?? diplomas;
  const masterCatalog = options.masters ?? masters;
  let diplomaFailures = options.failDiplomasOnce ? 1 : 0;

  await page.route(DIPLOMAS_LIST_URL, async (route) => {
    if (diplomaFailures > 0) {
      diplomaFailures -= 1;
      await route.fulfill({
        headers: { 'Access-Control-Allow-Origin': '*' },
        status: 500,
      });
      return;
    }

    await route.fulfill(jsonResponse(diplomaCatalog));
  });
  await page.route(MASTERS_LIST_URL, async (route) => {
    await route.fulfill(jsonResponse(masterCatalog));
  });
};

// English UI, so assertions read naturally and don't depend on the default.
export const useEnglish = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('finki-hub-lang', 'en');
  });
};
