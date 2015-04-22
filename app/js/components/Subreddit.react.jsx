/** @jsx React.DOM */
var React = require("react");
var states = require("../constants/subredditStates");

// load components
var PendingAlert = require("./shared/PendingAlert.react");

var Content = React.createClass({
  render(){
    return null;
  }
});

module.exports = React.createClass({

  _getActiveComponent( state ){
    switch ( state ){
      case states.SUBREDDIT_PENDING: return <PendingAlert />;
      case states.SUBREDDIT_READY: return <Content {...this.state}/>;
      case states.SUBREDDIT_FAILED:
        var message = config.alert.failedLoadSubreddit.replace('%s', this.props.name );
        return <InvalidAlert message={message} />;
    }
  },

  getInitialState(){
    return {
      state: states.SUBREDDIT_PENDING,
      about: null,
      posts: null
    };
  },

  componentWillMount(){

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