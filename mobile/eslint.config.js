// eslint.config.js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const jestPlugin = require('eslint-plugin-jest');
const testingLibrary = require('@testing-library/eslint-plugin');

module.exports = defineConfig([

  // Expo defaults (React Native ecosystem)
  expoConfig,

  // Jest support — isolated to test files only
  {
    files: [
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    plugins: {
      jest: jestPlugin,
      testingLibrary,
    },
    languageOptions: {
      globals: {
        // enables describe(), it(), expect(), beforeEach(), etc.
        jest: true,
      },
    },
    rules: {
      // Jest recommended rules
      ...jestPlugin.configs.recommended.rules,

      // Testing Library rules for RN tests
      ...testingLibrary.configs.react.rules,
    },
  },

  // Maintain your ignore rules
  {
    ignores: ['dist/*'],
  },
]);
