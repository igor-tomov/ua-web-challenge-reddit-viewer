/** @jsx React.DOM */
var React      = require("react"),
    Navigation = require('./Navigation.react'),
    Welcome    = require('./Welcome.react');

module.exports = React.createClass({displayName: "exports",
  render: function(){
    var props = this.props;

    return (
      React.createElement("div", {id: "app-container", className: "reddit-viewer"}, 
        React.createElement(Navigation, {title: props.title}), 
        React.createElement(Welcome, React.__spread({},  props))
      )
    );
  }

});