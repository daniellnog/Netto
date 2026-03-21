const path = require("path")
const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")

const root = path.resolve(__dirname, "../..")

const config = getDefaultConfig(__dirname)

config.watchFolders = [root]

config.resolver.extraNodeModules = {
  react: path.resolve(root, "node_modules/react"),
  "react-dom": path.resolve(root, "node_modules/react-dom"),
  "react-native": path.resolve(root, "node_modules/react-native"),
}

module.exports = withNativeWind(config, { input: "./global.css" })
