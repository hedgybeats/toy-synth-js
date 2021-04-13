const path = require('path');
module.exports = {
  entry: './src/script.js',
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              plugins: ['@babel/plugin-transform-runtime'],
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'public', 'js'),
    publicPath: '/',
    filename: 'script.bundle.js',
  },
  stats: {
    colors: true,
  },
  mode: 'production',
  devtool: 'source-map',
};
