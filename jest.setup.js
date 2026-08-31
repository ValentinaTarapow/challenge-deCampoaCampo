jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  function MockIcon({ name, accessibilityLabel }) {
    return React.createElement(Text, { accessibilityLabel }, name);
  }

  return {
    MaterialCommunityIcons: MockIcon,
  };
});

