// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Exclude test files from the bundle
config.resolver.blockList = [
  /.*\.test\.[jt]sx?$/,
  /.*\.spec\.[jt]sx?$/,
]

module.exports = config
