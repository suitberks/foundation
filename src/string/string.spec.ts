import { describe, expect, test } from 'bun:test';

import { escapeLikePattern } from '@/index';

// These tests cover literal escaping for values embedded within SQL `LIKE` patterns;
// They preserve ordinary text, Unicode content, escape ordering, and caller composition;

// == LiteralEscaping ===================================================

describe('escapeLikePattern', () => {
  test('preserves ordinary text without wildcard characters', () => {
    expect(escapeLikePattern('ordinary text')).toBe('ordinary text');
  });

  test('escapes percent wildcards', () => {
    expect(escapeLikePattern('50%')).toBe(String.raw`50\%`);
  });

  test('escapes underscore wildcards', () => {
    expect(escapeLikePattern('first_last')).toBe(String.raw`first\_last`);
  });

  test('escapes the configured SQL pattern escape character', () => {
    expect(escapeLikePattern(String.raw`C:\files`)).toBe(String.raw`C:\\files`);
  });

  test('escapes backslashes before every wildcard without re-escaping inserted characters', () => {
    expect(escapeLikePattern(String.raw`C:\files\100%_done`)).toBe(String.raw`C:\\files\\100\%\_done`);
  });

  test('escapes consecutive wildcard characters independently', () => {
    expect(escapeLikePattern('%%%___')).toBe(String.raw`\%\%\%\_\_\_`);
  });

  test('preserves an empty value', () => {
    expect(escapeLikePattern('')).toBe('');
  });

  test('preserves Georgian and Cyrillic content around escaped wildcards', () => {
    expect(escapeLikePattern('ქართული_текст%')).toBe('ქართული\\_текст\\%');
  });

  test('supports caller-owned contains, prefix, and suffix composition', () => {
    const escapedValue = escapeLikePattern('50%_done');

    expect(`%${escapedValue}%`).toBe(String.raw`%50\%\_done%`);
    expect(`${escapedValue}%`).toBe(String.raw`50\%\_done%`);
    expect(`%${escapedValue}`).toBe(String.raw`%50\%\_done`);
  });
});
