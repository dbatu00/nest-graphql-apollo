import { Stack } from "expo-router";
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'shadow*',
  'resizeMode',
]);

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}