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

  onLoadCompleted: function( data ){
    this._state    = subredditStates.SUBREDDIT_READY;
    this._about    = data.shift();
    this._sections = data.shift();
    this._posts    = data.shift();

    this.trigger( this.getCurrentState() );
  }
});