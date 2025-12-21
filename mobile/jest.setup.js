import "@testing-library/jest-native/extend-expect";

// Mock global fetch for GraphQL requests
global.fetch = jest.fn();

// Mock window.confirm used in Add User flow
global.confirm = jest.fn(() => true);

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000/graphql';