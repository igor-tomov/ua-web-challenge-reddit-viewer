var Reflux           = require('reflux'),
    subredditActions = require( "../actions/sebredditActions" ),
    subredditStates  = require( "../constants/subredditStates" );

module.exports = Reflux.createStore({
  listenables: subredditActions,

  _state: subredditStates.SUBREDDIT_PENDING,
  _sections: [],
  _about: {},
  _posts: {},

  getCurrentState: function(){
    return {
      state: this._state,
      about: this._about,
      sections: this._sections,
      posts: this._posts
    }
  },

  onLoadCompleted: function( about, sections, posts ){
    this._state    = subredditStates.SUBREDDIT_READY;
    this._about    = about;
    this._sections = sections;
    this._posts    = posts;

    this.trigger( this.getCurrentState() );
  },

  onLoadFailed: function(){
    this._state = subredditStates.SUBREDDIT_FAILED;

    this.trigger( this.getCurrentState() );
  }
});