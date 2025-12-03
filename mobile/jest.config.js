const { pathsToModuleNameMapper } = require("ts-jest");
const tsconfig = require("./tsconfig.json");

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },

  transformIgnorePatterns: [
    'node_modules/(?!(expo|expo-modules-core|@expo|@unimodules|react-native|@react-native|@react-navigation)/)',
  ],

  moduleNameMapper: pathsToModuleNameMapper(
    tsconfig.compilerOptions.paths,
    { prefix: '<rootDir>/' }
  ),

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
