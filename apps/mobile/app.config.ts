import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'BYND8',
  slug: 'cypher',
  version: '0.0.0',
  orientation: 'portrait',
  scheme: 'cypher',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  jsEngine: 'hermes',
  icon: './assets/brand/bynd8-app-icon.png',
  splash: {
    image: './assets/brand/bynd8-mark.png',
    backgroundColor: '#0B0B0B',
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
      foregroundImage: './assets/brand/bynd8-app-icon.png',
      backgroundColor: '#0B0B0B',
    },
    edgeToEdgeEnabled: true,
    userInterfaceStyle: 'dark',
  },
  androidStatusBar: {
    barStyle: 'light-content',
    backgroundColor: '#0B0B0B',
  },
  web: {
    bundler: 'metro',
    output: 'single',
    backgroundColor: '#0B0B0B',
  },
  plugins: ['expo-router', 'expo-font'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
