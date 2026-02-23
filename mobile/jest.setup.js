import "@testing-library/jest-native/extend-expect";

// Mock global fetch for GraphQL requests
global.fetch = jest.fn();

// Mock window.confirm used in Add User flow
global.confirm = jest.fn(() => true);

// Mock localStorage (REQUIRED)
Object.defineProperty(global, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(async () => undefined),
}), { virtual: true });

// Env vars
process.env.EXPO_PUBLIC_API_URL = "http://localhost:3000/graphql";
