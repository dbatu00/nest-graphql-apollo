/**
 * Suppress specific deprecation warnings in React Native Web while keeping other warnings intact.
 *
 * Purpose:
 * - React Native Web / Expo Router emits deprecation warnings for certain props, such as:
 *   - "props.pointerEvents is deprecated. Use style.pointerEvents"
 *   - '"shadow*" style props are deprecated. Use "boxShadow".'
 * - These warnings are safe to ignore for now, but appear every render and clutter the console.
 *
 * How it works:
 * 1. Check if the platform is web (Platform.OS === 'web'), so mobile logs are unaffected.
 * 2. Save the original console.warn function to preserve normal warning behavior.
 * 3. Override console.warn with a custom function.
 *    - Capture all arguments passed to console.warn (usually the warning message).
 *    - If the warning message contains either "pointerEvents" or "shadow*", return immediately to ignore it.
 *    - Otherwise, call the original console.warn to show the warning normally.
 *
 * Benefits:
 * - Silences noisy, non-critical warnings in the web console.
 * - Keeps other warnings visible, so real issues are not hidden.
 * - Can be placed in a global entry point (e.g., root App.tsx or index.tsx) to apply project-wide.
 *
 * Notes:
 * - Only affects the web platform; warnings on iOS and Android remain visible.
 * - Easy to extend for other warnings by adding more conditions in the if statement.
 */
import UsersDemo from "../../components/UsersDemo";
import { Platform } from 'react-native';

// Silence pointerEvents and shadow* warnings on web
if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('props.pointerEvents is deprecated') ||
       args[0].includes('"shadow*" style props are deprecated') ||
       args[0].includes('style.resizeMode is deprecated')
       )
    ) {
      return;
    }
    originalWarn(...args);
  };
}

export default function Page() {
  return <UsersDemo />;
}
