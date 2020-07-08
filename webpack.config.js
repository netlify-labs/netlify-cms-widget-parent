/*eslint-env node */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = (env) => {
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'netlify-cms-widget-parent.js',
    },
    devtool: 'source-map',
    mode: env.production ? 'production' : 'development',
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        inject: false,
        minify: false,
        filename: path.resolve(__dirname, 'dist/index.html'),
        template: path.resolve(__dirname, 'example', 'index.ejs'),
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'example', 'config.yml'),
            to: path.resolve(__dirname, 'dist', 'config.yml'),
            transform(content) {
              return content
                .toString()
                .replace('CMS_BRANCH_PLACEHOLDER', process.env.HEAD || 'main');
            },
          },
        ],
      }),
    ],
    devServer: {
      port: 8888,
    },
  };
};
