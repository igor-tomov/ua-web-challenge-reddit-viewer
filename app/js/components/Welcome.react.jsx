/** @jsx React.DOM */
var React = require("react");

module.exports = React.createClass({
  render: function(){
    var examples = this.props.examples;

    examples = Object.keys( examples ).map(function( uri, i ){
      return <li key={i} className="list-group-item"><a href={uri}>{examples[uri]}</a></li>
    });

    return (
      <div className='welcome container'>
        <div className='page-header'>
          <h1>Welcome to <span className='app-title'>{this.props.title}</span></h1>
        </div>
        <p className='lead'>
          Provide target Subreddit name in the URI as <code>/?/&lt;subreddit_name&gt;</code>.<br/>
          For example:
        </p>
        <div className='examples'>
          <ul className='list-group'>
            {examples}
          </ul>
        </div>
      </div>
    );
  }
});