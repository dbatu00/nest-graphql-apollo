// utils/validateUserName.ts
export function validateUserName(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9]*$/.test(name);
}
