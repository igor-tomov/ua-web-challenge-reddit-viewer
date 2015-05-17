/** @jsx React.DOM */
var React  = require("react"),
    Reflux = require("reflux"),
    config = require('../config'),
    states = require("../constants/subredditStates"),

    PendingAlert     = require("./shared/PendingAlert.react"),
    InvalidAlert     = require("./shared/InvalidAlert.react"),
    subredditActions = require("../actions/sebredditActions"),
    subredditStore   = require("../stores/suredditStore");


/**
 * Container for representation of obtained Subreddit data
 *
 * @type {*|Function}
 */
var SubredditContent = React.createClass({
  render(){
    var about = this.props.about;

    return (
      <div>
        <h1>{about.title}</h1>
        <h2>{about.description}</h2>
      </div>
    );
  }
});

/**
 * Output Subreddit component
 */
module.exports = React.createClass({

  mixins: [ Reflux.listenTo( subredditStore, "_onLoadSubreddit" ) ],

  _getActiveComponent( state ){
    switch ( state ){
      case states.SUBREDDIT_PENDING: return <PendingAlert />;
      case states.SUBREDDIT_READY: return <SubredditContent {...this.state}/>;
      case states.SUBREDDIT_FAILED:
        var message = config.alerts.failedLoadSubreddit.replace('%s', this.props.name );
        return <InvalidAlert message={message} />;
    }
  },

  _onLoadSubreddit: function( state ){
    this.setState( state );
  },

  getInitialState(){
    return subredditStore.getCurrentState();
  },

  componentWillMount(){
    subredditActions.load( this.props.name );
  },

  render(){
    var activeComponent = this._getActiveComponent( this.state.state );

    return (
      <div className='container'>
        {activeComponent}
      </div>
    );
  }
});