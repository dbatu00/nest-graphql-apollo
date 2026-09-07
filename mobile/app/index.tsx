/*
Kind:
Route component

Role:
Application root placeholder route

Responsibility:
- Mount side-effect setup for root-level warnings
- Render no UI and delegate all auth/verification routing to root layout gate

Owns:
- Nothing

Delegates:
- Authentication + route gating → app/_layout AppNavigator

Used by:
- Expo Router (when "/" is matched)
*/

import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'shadow* style props are deprecated',  // boxShadow warning
  'props.pointerEvents is deprecated',   // pointerEvents warning
]);

export default function Index() {
  return null;
}
