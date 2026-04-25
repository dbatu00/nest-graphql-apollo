export const LIKE_TYPE = {
  POST: 'post',
  COMMENT: 'comment',
} as const;

export type LikeType = (typeof LIKE_TYPE)[keyof typeof LIKE_TYPE];
