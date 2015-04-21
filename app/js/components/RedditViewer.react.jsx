/** @jsx React.DOM */
var React = require("react");

// constants
var states = require("../constants/appStates");

// stores
var appStateStore = require( "../stores/appStateStore" );

// load components
var Navigation            = require('./Navigation.react'),
    Welcome               = require('./Welcome.react'),
    Subreddit             = require('./Subreddit.react'),
    InvalidSubredditAlert = require('./InvalidSubredditAlert.react');

module.exports = React.createClass({

  _stateComponentFactory( state ){
    var props = this.props;

    switch ( state ){
      case states.WELCOME: return <Welcome {...props}/>; break;
      case states.SUBREDDIT_SUPPLIED: return <Subreddit {...props}/>; break;
      case states.INVALID_SUBREDDIT_SUPPLY: return <InvalidSubredditAlert />; break;
    }
  },

  getInitialState: function(){
    return appStateStore.getCurrentState();
  },

  render: function(){
    var stateComponent = this._stateComponentFactory( this.state.appState );

    return (
      <div id='app-container' className='reddit-viewer'>
        <Navigation title={this.props.title} />
        {stateComponent}
      </div>
    );
  }

});