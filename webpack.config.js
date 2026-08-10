const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const path = require('path');

module.exports = {
  // Use our tiny connector in the site folder as the entry point
  entry: './site/data.js',
  
  output: {
    path: path.resolve(__dirname, 'dist'), // Output the bundle to ./dist/
    publicPath: '',
  },
  
  plugins: [
    // 1. Tell Webpack to use our HTML file in the site folder as the base template
    new HtmlWebpackPlugin({
      template: './site/index.html',
      filename: 'index.html',
      inject: 'body',
    }),
    // 2. Tell Webpack to inline the JS directly into the HTML file
    new HtmlInlineScriptPlugin()
  ],
  
  // We don't need source maps or external files for this portal
  devtool: false, 
};
