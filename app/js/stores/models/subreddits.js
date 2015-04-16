var reddit = require('reddit.js');


function Subreddit( name ){
  this.name = name;
}

Subreddit.prototype = {
  constructor: Subreddit
};