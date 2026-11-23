import { matchesNormalizedSearch, normalizeSearchText } from './utils';

export type HighlightRange = readonly [start: number, end: number];

const SEARCHABLE_CHARACTER = /[\p{Letter}\p{Mark}\p{Number}]/u;

// Builds the same normalized form used for searching, while remembering which
// original character produced each normalized character, so matches can be
// mapped back onto the displayed text.
const buildNormalizedIndex = (text: string) => {
  let normalized = '';
  const sourceIndex: number[] = [];
  let offset = 0;

  for (const character of text) {
    const fragment =
      normalizeSearchText(character) ||
      (SEARCHABLE_CHARACTER.test(character) ? '' : ' ');

    for (const normalizedCharacter of fragment) {
      const isRepeatedSpace =
        normalizedCharacter === ' ' &&
        (normalized.length === 0 || normalized.endsWith(' '));

      if (isRepeatedSpace) {
        continue;
      }

      normalized += normalizedCharacter;
      sourceIndex.push(offset);
    }

    offset += character.length;
  }

  // Mirror the two-letter Latin equivalent folded by normalizeSearchText.
  return { normalized: normalized.replaceAll('dj', 'gj'), sourceIndex };
};

export const findHighlightRanges = (
  text: string,
  query: string,
): HighlightRange[] => {
  const normalizedQuery = normalizeSearchText(query);
  // Cheap check first, and it keeps highlighting in sync with what the search
  // itself considers a match.
  if (
    normalizedQuery.length === 0 ||
    !matchesNormalizedSearch(text, normalizedQuery)
  ) {
    return [];
  }

  const { normalized, sourceIndex } = buildNormalizedIndex(text);
  const ranges: HighlightRange[] = [];
  let from = normalized.indexOf(normalizedQuery);

  while (from !== -1) {
    const last = from + normalizedQuery.length - 1;
    const start = sourceIndex[from] ?? 0;
    const lastSource = sourceIndex[last] ?? start;
    const end =
      lastSource + ((text.codePointAt(lastSource) ?? 0) > 0xff_ff ? 2 : 1);
    const previous = ranges.at(-1);

    if (previous && start <= previous[1]) {
      ranges[ranges.length - 1] = [previous[0], Math.max(previous[1], end)];
    } else {
      ranges.push([start, end]);
    }

    from = normalized.indexOf(normalizedQuery, from + normalizedQuery.length);
  }

  return ranges;
};
