import { describe, expect, it } from 'vitest';

import { findHighlightRanges } from './highlight';

const highlighted = (text: string, query: string) =>
  findHighlightRanges(text, query).map(([start, end]) =>
    text.slice(start, end),
  );

describe('findHighlightRanges', () => {
  it('matches case-insensitively and finds every occurrence', () => {
    expect(highlighted('Machine learning and Learning', 'learning')).toEqual([
      'learning',
      'Learning',
    ]);
  });

  it('matches Cyrillic text from a Latin query and vice versa', () => {
    expect(highlighted('Машинско учење', 'mašinsko')).toEqual(['Машинско']);
    expect(highlighted('Ѓорѓи Ќосев', 'gjorgji')).toEqual(['Ѓорѓи']);
    expect(highlighted('Gjorgji Kjosev', 'ѓорѓи')).toEqual(['Gjorgji']);
  });

  it('ignores punctuation and repeated whitespace like the search does', () => {
    expect(
      highlighted('Web-апликација  за  учење', 'web апликација за'),
    ).toEqual(['Web-апликација  за']);
  });

  it('returns nothing for an empty query or no match', () => {
    expect(findHighlightRanges('Наслов', '')).toEqual([]);
    expect(findHighlightRanges('Наслов', '  ')).toEqual([]);
    expect(findHighlightRanges('Наслов', 'xyz')).toEqual([]);
  });
});
