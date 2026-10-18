// Jest runs only the pure logic (src/lib, src/db) in Node.
// babel-preset-expo ships inside the expo package, so resolve it from there
// instead of adding another dependency.
const presetExpo = require.resolve('babel-preset-expo', {
  paths: [require.resolve('expo/package.json')],
});

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '\\.js$': ['babel-jest', { presets: [presetExpo], babelrc: false, configFile: false }],
  },
};
