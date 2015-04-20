/** @jsx React.DOM */
var React = require("react");

module.exports = React.createClass({displayName: 'exports',
  render: function(){
    return (
      React.DOM.div({className: "navbar navbar-default navbar-static-top"}, 
        React.DOM.div({className: "container"}, 
          React.DOM.div({className: "navbar-header"}, 
            React.DOM.span({className: "navbar-brand"}, this.props.title)
          )
        )
      )
    );
  }

});