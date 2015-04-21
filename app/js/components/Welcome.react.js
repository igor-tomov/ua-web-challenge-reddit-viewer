/** @jsx React.DOM */
var React = require("react");

module.exports = React.createClass({displayName: "exports",
  render: function(){
    var examples = this.props.examples;

    examples = Object.keys( examples ).map(function( uri, i ){
      return React.createElement("li", {key: i, className: "list-group-item"}, React.createElement("a", {href: uri}, examples[uri]))
    });

    return (
      React.createElement("div", {className: "welcome container"}, 
        React.createElement("div", {className: "page-header"}, 
          React.createElement("h1", null, "Welcome to ", React.createElement("span", {className: "app-title"}, this.props.title))
        ), 
        React.createElement("p", {className: "lead"}, 
          "Provide target Subreddit name in the URI as ", React.createElement("code", null, "/?/<subreddit_name>"), ".", React.createElement("br", null), 
          "For example:"
        ), 
        React.createElement("div", {className: "examples"}, 
          React.createElement("ul", {className: "list-group"}, 
            examples
          )
        )
      )
    );
  }
});