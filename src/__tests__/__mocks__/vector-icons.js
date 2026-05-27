const React = require('react');
const { View } = require('react-native');

// Mock minimale per @expo/vector-icons nei test:
// renderizza un View con testID invece dell'icona reale.
const createIcon = (family) => {
  const Icon = ({ testID, name, size, color, ...rest }) =>
    React.createElement(View, {
      testID: testID ?? `icon-${family}-${name ?? 'unknown'}`,
      ...rest,
    });
  Icon.displayName = family;
  return Icon;
};

module.exports = {
  MaterialCommunityIcons: createIcon('MaterialCommunityIcons'),
  Ionicons: createIcon('Ionicons'),
  FontAwesome: createIcon('FontAwesome'),
  FontAwesome5: createIcon('FontAwesome5'),
  AntDesign: createIcon('AntDesign'),
  Feather: createIcon('Feather'),
  MaterialIcons: createIcon('MaterialIcons'),
};
