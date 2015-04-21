/** @jsx React.DOM */
var React = require("react");

module.exports = React.createClass({
  render: function(){
    return (
      <div className='navbar navbar-default navbar-static-top'>
        <div className='container'>
          <div className='navbar-header'>
            <span className='navbar-brand'>{this.props.title}</span>
          </div>
        </div>
      </div>
    );
  }

});