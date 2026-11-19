import { describe, expect, it } from 'vitest';

import { DIPLOMAS_SECTION, getStatusInfo, MASTERS_SECTION } from './section';

describe('getStatusInfo', () => {
  it('marks in-progress diploma stages', () => {
    expect(
      getStatusInfo(DIPLOMAS_SECTION, 'Одобрение од продекан за настава'),
    ).toEqual({ maxStage: 9, stage: 4, tone: 'progress' });
  });

  it('marks defended and archived diplomas as complete', () => {
    expect(getStatusInfo(DIPLOMAS_SECTION, 'Одбрана').tone).toBe('complete');
    expect(getStatusInfo(DIPLOMAS_SECTION, 'Архива').tone).toBe('complete');
  });

  it('keeps statuses that only mention the defense in progress', () => {
    expect(
      getStatusInfo(DIPLOMAS_SECTION, 'Закажување на одбрана од менторот').tone,
    ).toBe('progress');
    expect(
      getStatusInfo(DIPLOMAS_SECTION, 'Очекување на текст од менторот'),
    ).toEqual({ maxStage: 9, stage: null, tone: 'progress' });
  });

  it('marks cancelled theses in both sections', () => {
    expect(getStatusInfo(DIPLOMAS_SECTION, 'Откажано од менторот').tone).toBe(
      'cancelled',
    );
    expect(getStatusInfo(MASTERS_SECTION, 'Магистерската е откажана.')).toEqual(
      { maxStage: 24, stage: null, tone: 'cancelled' },
    );
  });

  it('uses numbered masters steps and treats unknown statuses as neutral', () => {
    expect(
      getStatusInfo(
        MASTERS_SECTION,
        '12. Архивирање на материјали за предлог на комисија.',
      ),
    ).toEqual({ maxStage: 24, stage: 12, tone: 'progress' });
    expect(
      getStatusInfo(MASTERS_SECTION, '24. Магистерската е завршена.').tone,
    ).toBe('complete');
    expect(getStatusInfo(MASTERS_SECTION, '').tone).toBe('unknown');
  });
});
