/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Playwright specs live in e2e/ and must run via `npx playwright test`, not Jest.
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|@expo/.*|react-native-svg|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|standard-navigation))',
  ],
};
