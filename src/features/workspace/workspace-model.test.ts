import { describe, expect, it } from 'vitest';
import { resolveWorkspaceLocale, reservationFilter, pageNumber, itemKind, workspaceText } from './workspace';

describe('workspace model', () => {
  it('keeps a selected language and otherwise negotiates the browser language', () => {
    expect(resolveWorkspaceLocale('en', 'de-DE')).toBe('en');
    expect(resolveWorkspaceLocale(undefined, 'en-GB,en;q=0.9,de;q=0.2')).toBe('en');
    expect(resolveWorkspaceLocale(undefined, 'de-DE,de;q=0.9')).toBe('de');
    expect(resolveWorkspaceLocale('invalid', undefined)).toBe('de');
  });
  it('only permits known reservation filters and positive pages', () => {
    expect(reservationFilter('mine')).toBe('mine');
    expect(reservationFilter('SQL')).toBe('active');
    expect(pageNumber('-1')).toBe(1);
    expect(pageNumber('NaN')).toBe(1);
    expect(pageNumber('2')).toBe(2);
  });
  it('maps recognizable inventory to the existing illustrations', () => {
    expect(itemKind('Pavillon 3 x 3')).toBe('pavilion');
    expect(itemKind('Beamer')).toBe('projector');
    expect(itemKind('Musikanlage')).toBe('speaker');
    expect(itemKind('Bierzeltgarnitur')).toBe('benches');
    expect(itemKind('Werkzeugkiste')).toBe('generic');
  });
  it('has matching German and English keys and human-facing roles and states', () => {
    expect(Object.keys(workspaceText.de).sort()).toEqual(Object.keys(workspaceText.en).sort());
    expect(workspaceText.de.roles.OWNER).not.toBe('OWNER');
    expect(workspaceText.de.statuses.PENDING).not.toBe('PENDING');
  });
});
