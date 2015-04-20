/** @jsx React.DOM */
var React = require("react");

module.exports = React.createClass({displayName: 'exports',
  render: function(){
    var examples = this.props.examples;

    examples = Object.keys( examples ).map(function( uri ){
      return React.DOM.li({className: "list-group-item"}, React.DOM.a({href: uri}, examples[uri]))
    });

    return (
      React.DOM.div({className: "welcome container"}, 
        React.DOM.div({className: "page-header"}, 
          React.DOM.h1(null, "Welcome to ", React.DOM.span({className: "app-title"}, this.props.title))
        ), 
        React.DOM.p({className: "lead"}, 
          "Provide target Subreddit name in the URI as ", React.DOM.code(null, "/?/SUBREDDIT_NAME"), ".", React.DOM.br(null), 
          "For example:"
        ), 
        React.DOM.div({className: "examples"}, 
          React.DOM.ul({className: "list-group"}, 
            examples
          )
        )
      )
    );
  }
});