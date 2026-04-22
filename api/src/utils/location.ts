export const canonicalLocationName = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');

export const slugifyLocation = (value: string) =>
  canonicalLocationName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const localityAliases = (value: string) => {
  const canonical = canonicalLocationName(value);
  const segments = canonical
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return Array.from(new Set([canonical, ...segments])).filter(Boolean);
};
