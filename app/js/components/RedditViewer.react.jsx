/** @jsx React.DOM */
var React = require("react");

// constants
var states = require("../constants/appStates");

// config
var config = require('../config');

// stores
var appStateStore = require( "../stores/appStateStore" );

// load components
var Navigation   = require('./Navigation.react'),
    Welcome      = require('./Welcome.react'),
    Subreddit    = require('./Subreddit.react'),
    InvalidAlert = require('./shared/InvalidAlert.react');

module.exports = React.createClass({

  _getStateComponent( state ){
    var props = this.props;

    switch ( state ){
      case states.WELCOME: return <Welcome {...props}/>;
      case states.SUBREDDIT_SUPPLIED: return <Subreddit {...props} name={this.state.subreddit}/>;
      case states.INVALID_SUBREDDIT_SUPPLY: return <InvalidAlert message={config.alerts.invalidSubreddit} />;
    }
  },

  getInitialState(){
    return appStateStore.getCurrentState();
  },

  render(){
    return (
      <div id='app-container' className='reddit-viewer'>
        <Navigation title={this.props.title} />
        {this._getStateComponent( this.state.appState )}
      </div>
    );
  }

});