module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!(@react-native|react-native)/)"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
