/** @jsx React.DOM */
var React      = require("react"),
    Navigation = require('./Navigation.react'),
    Welcome    = require('./Welcome.react');

module.exports = React.createClass({displayName: 'exports',

  getDefaultProps: function(){
    return {
      //title: 'Reddit viewer'
    }
  },

  render: function(){
    var props = this.props;

    return (
      React.DOM.div({id: "app-container", className: "reddit-viewer"}, 
        Navigation({title: props.title}), 
        Welcome({title: props.title, examples: props.examples})
      )
    );
  }

});