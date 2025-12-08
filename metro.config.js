const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Unstable feature to fix import.meta for web
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Alias zustand ESM to CJS
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
