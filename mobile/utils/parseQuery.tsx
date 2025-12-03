// utils/parseQuery.ts
export function parseQuery(raw: string) {
  const parts = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean); //removes empty strings. # "" is a falsy value

  const ids: number[] = [];
  const names: string[] = [];

  for (const part of parts) {
    const n = Number(part);
    if (!isNaN(n)) ids.push(n);
    else names.push(part);
  }

  return { ids, names };
}