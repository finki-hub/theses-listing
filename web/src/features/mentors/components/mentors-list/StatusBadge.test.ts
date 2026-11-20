import { describe, expect, it } from 'vitest';

import { cleanStatusDescription } from './StatusBadge';

describe('cleanStatusDescription', () => {
  it('drops the masters step prefix and trailing period', () => {
    expect(cleanStatusDescription('22. Менторот ја закажува одбраната.')).toBe(
      'Менторот ја закажува одбраната',
    );
    expect(
      cleanStatusDescription('24. The master’s thesis is completed.'),
    ).toBe('The master’s thesis is completed');
  });

  it('keeps diploma statuses and inner punctuation intact', () => {
    expect(cleanStatusDescription('Одобрение од продекан за настава')).toBe(
      'Одобрение од продекан за настава',
    );
    expect(
      cleanStatusDescription('Секретар валидира. (статусот не се користи)'),
    ).toBe('Секретар валидира. (статусот не се користи)');
  });
});
