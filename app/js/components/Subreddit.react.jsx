/** @jsx React.DOM */
var React  = require("react"),
    Reflux = require("reflux"),
    states = require("../constants/subredditStates"),
    PendingAlert     = require("./shared/PendingAlert.react"),
    subredditActions = require("../actions/sebredditActions"),
    subredditStore   = require("../stores/suredditStore");

var Content = React.createClass({
  render(){
    return null;
  }
});

module.exports = React.createClass({

  mixins: [ Reflux.connect( subredditStore, "_onLoadSubreddit" ) ],

  _getActiveComponent( state ){
    switch ( state ){
      case states.SUBREDDIT_PENDING: return <PendingAlert />;
      case states.SUBREDDIT_READY: return <Content {...this.state}/>;
      case states.SUBREDDIT_FAILED:
        var message = config.alert.failedLoadSubreddit.replace('%s', this.props.name );
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