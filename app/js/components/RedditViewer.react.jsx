/** @jsx React.DOM */
var React      = require("react"),
    Navigation = require('./Navigation.react'),
    Welcome    = require('./Welcome.react');

module.exports = React.createClass({
  render: function(){
    var props = this.props;

    return (
      <div id='app-container' className='reddit-viewer'>
        <Navigation title={props.title} />
        <Welcome {...props} />
      </div>
    );
  }

});