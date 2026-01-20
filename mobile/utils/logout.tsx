import { clearToken } from '@/utils/token';
import { router } from 'expo-router';

export async function logout() {
  await clearToken();
  router.replace('/login');
}