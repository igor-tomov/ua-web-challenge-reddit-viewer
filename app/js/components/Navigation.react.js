/** @jsx React.DOM */
var React = require("react");

module.exports = React.createClass({displayName: "exports",
  render: function(){
    return (
      React.createElement("div", {className: "navbar navbar-default navbar-static-top"}, 
        React.createElement("div", {className: "container"}, 
          React.createElement("div", {className: "navbar-header"}, 
            React.createElement("span", {className: "navbar-brand"}, this.props.title)
          )
        )
      )
    );
  }

});