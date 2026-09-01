import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Cypher',
  slug: 'cypher',
  version: '0.0.0',
  orientation: 'portrait',
  scheme: 'cypher',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  jsEngine: 'hermes',
  splash: {
    backgroundColor: '#0A0A0A',
    resizeMode: 'contain',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.cypher.mobile',
    infoPlist: {
      UIStatusBarStyle: 'UIStatusBarStyleLightContent',
    },
  },
  android: {
    package: 'app.cypher.mobile',
    adaptiveIcon: {
      backgroundColor: '#0A0A0A',
    },
    edgeToEdgeEnabled: true,
    userInterfaceStyle: 'dark',
  },
  androidStatusBar: {
    barStyle: 'light-content',
    backgroundColor: '#0A0A0A',
  },
  web: {
    bundler: 'metro',
    output: 'single',
    backgroundColor: '#0A0A0A',
  },
  plugins: ['expo-router', 'expo-font', 'expo-linear-gradient'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
