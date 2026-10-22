export const STACKS = ['Next.js', 'React', 'Node.js', 'Python', 'Go', 'Any'] as const;
export type Stack = (typeof STACKS)[number];
export const INSTALL_COMMAND = (slug: string) => `npx hive add ${slug}`;
export const ACTIVITY_LIMIT = 8;
export const FEATURES = { personal: 'private_skills', team: 'team_private_skills' } as const;
