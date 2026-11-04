import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { supabase } from './supabase';

/** Signed in with an email listed as an admin. */
export async function isSignedInAdmin(): Promise<boolean> {
  const { data } = await supabase().auth.getSession();
  if (!data.session) return false;
  const { data: ok, error } = await supabase().rpc('am_i_admin');
  return !error && ok === true;
}

export const adminGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  if (await isSignedInAdmin()) return true;
  return router.createUrlTree(['/admin/login'], { queryParams: { next: state.url } });
};
