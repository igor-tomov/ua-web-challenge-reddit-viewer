/** @jsx React.DOM */
var React = require("react");


module.exports = React.createClass({
  propTypes: {
    message: React.PropTypes.string
  },

  render: function(){
    return (
      <div className='container'>
        <div className='invalid-subreddit-alert'>
          <div className='alert alert-danger' role='alert'>
            {this.props.message}
          </div>
        </div>
      </div>
    );
  }
});