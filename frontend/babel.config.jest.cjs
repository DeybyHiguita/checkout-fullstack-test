// Config de Babel usada SOLO por Jest (via jest.config.cjs).
// Se mantiene separada de Vite para no interferir con @vitejs/plugin-react.
module.exports = {
  sourceType: 'unambiguous',
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: ['babel-plugin-transform-import-meta'],
};
