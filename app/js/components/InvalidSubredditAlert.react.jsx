/** @jsx React.DOM */
var React  = require("react"),
    config = require('../config');


module.exports = React.createClass({
  render: function(){
    return (
      <div className='container'>
        <div className='invalid-subreddit-alert'>
          <div className='alert alert-danger' role='alert'>
            {config.invalidSubredditAlert}
          </div>
        </div>
      </div>
    );
  }
});