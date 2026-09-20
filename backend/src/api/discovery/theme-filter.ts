import { ThemeDefinition } from './themes';

export type ThemeFilter =
  | { kind: 'country'; value: string }
  | { kind: 'keywords'; values: string[] }
  | { kind: 'category'; value: string }
  | { kind: 'region'; value: string }
  | { kind: 'danger' }
  | { kind: 'transboundary' };

export function themeFilters(theme: ThemeDefinition): ThemeFilter[] {
  return [
    ...(theme.country
      ? [{ kind: 'country' as const, value: theme.country }]
      : []),
    ...(theme.keywords?.length
      ? [{ kind: 'keywords' as const, values: theme.keywords }]
      : []),
    ...(theme.category
      ? [{ kind: 'category' as const, value: theme.category }]
      : []),
    ...(theme.region ? [{ kind: 'region' as const, value: theme.region }] : []),
    ...(theme.danger ? [{ kind: 'danger' as const }] : []),
    ...(theme.transboundary ? [{ kind: 'transboundary' as const }] : []),
  ];
}
