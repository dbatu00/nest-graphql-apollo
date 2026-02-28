const { pathsToModuleNameMapper } = require("ts-jest");
const tsconfig = require("./tsconfig.json");

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },

  transformIgnorePatterns: [
    'node_modules/(?!(expo|expo-router|expo-modules-core|@expo|@unimodules|react-native|@react-native|@react-navigation|expo-asset|expo-constants|expo-font|expo-haptics|expo-image|expo-linking|expo-secure-store|expo-splash-screen|expo-status-bar|expo-system-ui|expo-web-browser)/)',
  ],

  moduleNameMapper: pathsToModuleNameMapper(
    tsconfig.compilerOptions.paths,
    { prefix: '<rootDir>/' }
  ),

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
