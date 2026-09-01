jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-font');
jest.mock('expo-asset');

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  function MockIcon({ name }: { name: string }) {
    return React.createElement(Text, { accessibilityLabel: name }, name);
  }
  return { Ionicons: MockIcon };
});
