import { z } from 'zod';
import { STACKS } from './constants';

export const publishSchema = z.object({
  title: z.string().trim()
    .min(3, 'Title needs at least 3 characters.')
    .max(60, 'Title can be at most 60 characters.'),
  description: z.string().trim()
    .min(10, 'Description needs at least 10 characters.')
    .max(160, 'Description can be at most 160 characters.'),
  stack: z.enum(STACKS, { message: 'Choose a stack.' }),
  tags: z.string()
    .transform((v) => [...new Set(v.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))])
    .pipe(z.array(z.string().regex(/^[a-z0-9-]{1,20}$/, 'Tags use lowercase letters, numbers and dashes, up to 20 characters each.'))
      .min(1, 'Add at least one tag.')
      .max(5, 'Use at most 5 tags.')),
  content: z.string().trim()
    .min(80, 'Skill content needs at least 80 characters.')
    .max(20000, 'Skill content can be at most 20,000 characters.'),
  visibility: z.enum(['public', 'private']).catch('public'),
});
