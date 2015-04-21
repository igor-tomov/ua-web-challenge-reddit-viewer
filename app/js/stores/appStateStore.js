var Reflux = require("reflux"),
    states = require("../constants/appStates");

module.exports = Reflux.createStore({

  _isURIEmpty: function(){
    return location.search.search( /^(\?\/)?.+/ ) === -1;
  },

  /**
   * Retrieve subreddit name from current URI
   * Name validation is provided as discussed here:
   * http://www.reddit.com/r/modhelp/comments/1gd1at/name_rules_when_trying_to_create_a_subreddit/
   *
   * @returns {*}
   */
  _retrieveSubredditFromURI: function(){
    var name = location.search.match( /^\?\/(\w{1,21})$/);

    return ( name && name.length === 2 ) ? name[1] : null;
  },

  getCurrentState: function(){
    var state, subreddit;

    if ( this._isURIEmpty() ){
      state = states.WELCOME;
    }else{
      subreddit = this._retrieveSubredditFromURI();
      state = subreddit ? states.SUBREDDIT_SUPPLIED : states.INVALID_SUBREDDIT_SUPPLY;
    }

    return {
      appState: state,
      subreddit: subreddit
    }
  }
});