export function slugify(input: string, max = 40): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
}

export async function uniqueSlug(
  base: string,
  fallback: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = base || fallback;
  if (!(await exists(root))) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
}
