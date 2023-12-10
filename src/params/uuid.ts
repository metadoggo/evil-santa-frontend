import type { ParamMatcher } from '@sveltejs/kit';
import { validate  } from 'uuid';

export const match = ((param) => {
  return validate(param);
}) satisfies ParamMatcher;