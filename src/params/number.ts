import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param) => {
  const n = parseInt(param);
  return n > 0;
}) satisfies ParamMatcher;