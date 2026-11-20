import { type CatalogResult, fetchDiplomas, fetchMasterTheses } from './api';
import {
  DIPLOMAS_FILE_URL,
  MASTERS_FILE_URL,
  STATUS_STAGES,
} from './constants';
import { createFileUrlGetter } from './utils';

export type SectionConfig = {
  basePath: string;
  fetchTheses: () => Promise<CatalogResult>;
  getFileUrl: (fileId: null | string) => null | string;
  getStatusStage: (status: string) => null | number;
  id: SectionId;
  // Whether a (lower-cased, trimmed) status means the thesis is defended or finished.
  isComplete: (status: string, stage: null | number) => boolean;
  maxStatusStage: number;
};

export type SectionId = 'diplomas' | 'masters';

const findDiplomaStatusStage = (status: string): null | number => {
  const lower = status.toLowerCase();

  for (const [keyword, stage] of STATUS_STAGES) {
    if (lower.includes(keyword)) {
      return stage;
    }
  }

  return null;
};

// Masters statuses are numbered workflow steps ("12. Архивирање…"); the
// cancelled status carries no number and maps to no stage.
const MASTERS_STATUS_STAGE_REGEX = /^(?<stage>\d+)\./u;

const findMastersStatusStage = (status: string): null | number => {
  const stage = MASTERS_STATUS_STAGE_REGEX.exec(status.trim())?.groups?.[
    'stage'
  ];

  return stage ? Number(stage) : null;
};

export type StatusInfo = {
  maxStage: number;
  stage: null | number;
  tone: StatusTone;
};

export type StatusTone = 'cancelled' | 'complete' | 'progress' | 'unknown';

const CANCELLED_KEYWORD = 'откаж';

export const getStatusInfo = (
  config: Pick<
    SectionConfig,
    'getStatusStage' | 'isComplete' | 'maxStatusStage'
  >,
  status: string,
): StatusInfo => {
  const stage = config.getStatusStage(status);
  const normalized = status.trim().toLowerCase();
  let tone: StatusTone = 'progress';

  if (normalized.length === 0) {
    tone = 'unknown';
  } else if (normalized.includes(CANCELLED_KEYWORD)) {
    tone = 'cancelled';
  } else if (config.isComplete(normalized, stage)) {
    tone = 'complete';
  }

  return { maxStage: config.maxStatusStage, stage, tone };
};

export const DIPLOMAS_SECTION: SectionConfig = {
  basePath: '/',
  fetchTheses: fetchDiplomas,
  getFileUrl: createFileUrlGetter(DIPLOMAS_FILE_URL),
  getStatusStage: findDiplomaStatusStage,
  id: 'diplomas',
  // "Одбрана" (defended) and the archiving steps that follow it. Statuses that
  // merely mention the defense, such as scheduling it, are still in progress.
  isComplete: (status) =>
    status.startsWith('одбран') || status.startsWith('архив'),
  maxStatusStage: 9,
};

export const MASTERS_SECTION: SectionConfig = {
  basePath: '/masters',
  fetchTheses: fetchMasterTheses,
  getFileUrl: createFileUrlGetter(MASTERS_FILE_URL),
  getStatusStage: findMastersStatusStage,
  id: 'masters',
  // Step 23 is the post-defense archiving, step 24 marks the thesis finished.
  isComplete: (_status, stage) => stage !== null && stage >= 23,
  maxStatusStage: 24,
};
