import type { CookieOptions } from '@supabase/ssr';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

type NextCookieOptions = Partial<Omit<ResponseCookie, 'name' | 'value'>>;

export function adaptCookieOptions(
  options?: CookieOptions
): NextCookieOptions | undefined {
  if (!options) {
    return undefined;
  }

  const {
    domain,
    path,
    expires,
    httpOnly,
    maxAge,
    partitioned,
    secure,
    sameSite,
    priority,
  } = options;

  const normalizedSameSite =
    typeof sameSite === 'boolean'
      ? sameSite
        ? 'strict'
        : undefined
      : sameSite;

  return {
    domain,
    path,
    expires,
    httpOnly,
    maxAge,
    partitioned,
    secure,
    priority,
    sameSite: normalizedSameSite,
  } satisfies NextCookieOptions;
}
