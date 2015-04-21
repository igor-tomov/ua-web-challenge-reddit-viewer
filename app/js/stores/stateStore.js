var Reflux = require("reflux");

return Reflux.createStore({

  /**
   * Retrieve subreddit name from current URI
   * Name validation is provided as discussed here:
   * http://www.reddit.com/r/modhelp/comments/1gd1at/name_rules_when_trying_to_create_a_subreddit/
   *
   * @returns {*}
   */
  _retrieveSubredditFromURI: function(){
    var name = location.search.match( /^\?\/(\w{1,21})?/);

    return ( name && name.length === 2 ) ? name[1] : null;
  }
});