import { config } from 'dotenv';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

// The secret key bypasses RLS. Only this script and the webhook route may use it.
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

type Author = { id: string; handle: string; display_name: string; stack: string };

function parse(file: string) {
  const raw = readFileSync(file, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`No frontmatter in ${file}`);
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const tags = (meta.tags ?? '').replace(/^\[|\]$/g, '').split(',').map((t) => t.trim()).filter(Boolean);
  return { meta, tags, content: match[2].trim() };
}

function must(result: { error: unknown }) {
  if (result.error) throw result.error;
}

async function main() {
  // 1. Reset the shelf. Real users' profiles stay; seed authors are recreated.
  for (const table of ['activities', 'notifications', 'follows', 'comments', 'stars', 'skills']) {
    must(await db.from(table).delete().not('created_at', 'is', null));
  }
  must(await db.from('profiles').delete().like('id', 'seed_%'));

  // 2. Authors
  const authors: Author[] = JSON.parse(readFileSync('seed/authors.json', 'utf8'));
  must(await db.from('profiles').insert(authors));

  // 3. Skills in file-name order. Skill i was published (i * 7 + 3) hours ago.
  //    The skills trigger creates one "published" activity per skill with the same time.
  const dir = 'seed/skills';
  const files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  const now = Date.now();
  const rows = files.map((file, i) => {
    const { meta, tags, content } = parse(join(dir, file));
    const author = authors.find((a) => a.handle === meta.author);
    if (!author) throw new Error(`Unknown author "${meta.author}" in ${file}`);
    return {
      slug: file.replace(/\.md$/, ''),
      title: meta.title,
      description: meta.description,
      content,
      tags,
      stack: meta.stack,
      visibility: 'public',
      author_id: author.id,
      stars_count: Number(meta.stars ?? 0),
      created_at: new Date(now - (i * 7 + 3) * 3_600_000).toISOString(),
    };
  });
  must(await db.from('skills').insert(rows));

  console.log(`Seeded ${authors.length} authors and ${rows.length} skills.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
