import { clearToken } from '@/utils/token';
import { router } from 'expo-router';

export async function logout() {
  try {
    clearToken();
  } catch (err: unknown) {
    console.error('[logout] token clear failed', err);
  } finally {
    router.replace('/login');
  }
}