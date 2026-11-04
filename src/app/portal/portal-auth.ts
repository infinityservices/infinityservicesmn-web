import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { portalSupabase } from './portal-supabase';

/** True when the URL is a magic link Supabase rejected (expired or already used). */
export function isFailedLinkRedirect(hash: string, search = ''): boolean {
  return /(^|[#&?])error(_code)?=/.test(hash) || /(^|[?&])error(_code)?=/.test(search);
}

export const portalGuard: CanActivateFn = async () => {
  const router = inject(Router);
  if (typeof location !== 'undefined' && isFailedLinkRedirect(location.hash, location.search)) {
    return router.createUrlTree(['/portal/login'], { queryParams: { link: 'expired' } });
  }
  // Waits for Supabase to read a magic-link session from the URL, if any.
  const { data } = await portalSupabase().auth.getSession();
  if (data.session) return true;
  return router.createUrlTree(['/portal/login']);
};
