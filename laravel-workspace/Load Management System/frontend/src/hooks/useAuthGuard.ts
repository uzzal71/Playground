'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from './useRedux';
import { hydrateAuth } from '@/store/authSlice';

/**
 * Hook that protects pages — redirects to login if not authenticated.
 */
export function useAuthGuard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  return { isAuthenticated };
}

/**
 * Hook that redirects authenticated users away from login/register pages.
 */
export function useGuestGuard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  return { isAuthenticated };
}
