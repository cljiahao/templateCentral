export type AvatarColor =
  | 'sky'
  | 'teal'
  | 'emerald'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'pink'
  | 'purple'
  | 'fuchsia'
  | 'violet';

export const AVATAR_COLOR_MAP: Record<AvatarColor, string> = {
  sky: 'bg-sky-500',
  teal: 'bg-teal-500',
  emerald: 'bg-emerald-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  pink: 'bg-pink-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  violet: 'bg-violet-500',
} as const;

export const AVATAR_OVERFLOW_COLOR = 'bg-muted-foreground';
