// Browserify adapter for Reddit.js, https://github.com/sahilm/reddit.js
// which is doesn't support CommonJS
var reddit = require('reddit.js');

if ( ! reddit || ! Object.keys( reddit ).length ){
  reddit = window.reddit;
}

module.exports = reddit;