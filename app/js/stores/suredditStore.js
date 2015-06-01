var Reflux           = require('reflux'),
    subredditActions = require( "../actions/sebredditActions" ),
    subredditStates  = require( "../constants/subredditStates" );

module.exports = Reflux.createStore({
  listenables: subredditActions,

  _state: subredditStates.SUBREDDIT_PENDING,
  _sectionList: [],
  _section: null,
  _about: {},
  _posts: {},

  getCurrentState: function(){
    return {
      state: this._state,
      about: this._about,
      section: this._section,
      sectionList: this._sectionList,
      posts: this._posts
    }
  },

  onLoadCompleted: function( data ){
    this._state       = subredditStates.SUBREDDIT_READY;
    this._about       = data.shift();
    this._sectionList = data.shift();
    this._posts       = data.shift().posts;
    this._section     = this._sectionList[0];

    this.trigger( this.getCurrentState() );
  },

  onLoadFailed: function(){
    this._state = subredditStates.SUBREDDIT_FAILED;

    this.trigger( this.getCurrentState() );
  },

  onLoadSection: function( name, section ){
    this._section = section;
    this._state   = subredditStates.SUBREDDIT_SECTION_PENDING;

    this.trigger( this.getCurrentState() );
  },

  onLoadSectionCompleted: function( data ){
    if ( this._section !== data.section ){
      return;
    }

    this._state = subredditStates.SUBREDDIT_READY;
    this._posts = data.posts;

    this.trigger( this.getCurrentState() );
  }
});