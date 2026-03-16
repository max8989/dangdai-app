// Babel plugin that replaces `import.meta.env` with `undefined`.
// Zustand >=5 ESM builds (.mjs) use `import.meta.env` to detect the Vite dev
// environment. Metro bundles web output as a non-module script (no type="module"),
// so `import.meta` is a SyntaxError that freezes the app on the splash screen.
// This plugin neutralises the expression so the devtools middleware gracefully
// falls back to the CJS code path without crashing.
function importMetaEnvPlugin({ types: t }) {
  return {
    name: 'replace-import-meta-env',
    visitor: {
      MemberExpression(path) {
        // Match: import.meta.env  or  import.meta.env.MODE  etc.
        if (
          t.isMetaProperty(path.node.object) &&
          path.node.object.meta.name === 'import' &&
          path.node.object.property.name === 'meta' &&
          t.isIdentifier(path.node.property, { name: 'env' })
        ) {
          path.replaceWith(t.identifier('undefined'))
        }
      },
    },
  }
}

module.exports = (api) => {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],

      // NOTE: this is only necessary if you are using reanimated for animations
      'react-native-reanimated/plugin',

      // Replace `import.meta.env` (Vite-only) with `undefined` so Zustand's
      // devtools middleware doesn't crash on Metro web builds.
      importMetaEnvPlugin,
    ],
  }
}
