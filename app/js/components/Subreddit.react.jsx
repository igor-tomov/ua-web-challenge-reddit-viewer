/** @jsx React.DOM */
var React      = require("react"),
    Reflux     = require("reflux"),
    classnames = require('classnames'),

    config = require('../config'),
    states = require("../constants/subredditStates"),

    PendingAlert     = require("./shared/PendingAlert.react"),
    InvalidAlert     = require("./shared/InvalidAlert.react"),
    subredditActions = require("../actions/sebredditActions"),
    subredditStore   = require("../stores/suredditStore");


/**
 * Viewer of main information about Sebreddit
 */
var SubredditHeader = React.createClass({
  render(){
    return (
      <div className='subreddit-header'>
        <h1>{this.props.title}</h1>
        <p className='lead'>{this.props.description}</p>
      </div>
    );
  }
});

var SubredditSectionTabs = React.createClass({
  _onTabClick(event){
    event.preventDefault();

    var section = event.target.dataset.section;

    if ( this.props.section !== section ){
      console.log( section );
    }
  },

  render(){
    var self    = this,
        current = this.props.section;

    // build tab list
    var sectionList = this.props.sectionList.map(( section, i ) => {
      var classes = classnames({ active: section === current });

      return (
        <li key={i} className={classes}>
          <a href="#" data-section={section} onClick={self._onTabClick}>{section}</a>
        </li>
      );
    });

    return (
      <nav>
        <ul className='subreddit-section-tabs'>
          {sectionList}
        </ul>
      </nav>
    );
  }
});

var SubredditSectionPosts = React.createClass({
  render(){
    var posts = this.props.posts.map(( post, i ) => {
      return (
        <div key={i} className='subreddit-post-item'>
          <h4>{post.title}</h4>
          <p>
            Created: <i>{post.created}</i>,
            author: <i>{post.author}</i>
            <span className='post-view'>
              <a href='#' data-post-index={i}>view</a>
            </span>
          </p>
        </div>
      );
    });

    return (
      <div className='subreddit-section-posts'>
        {posts}
      </div>
    );
  }
});


var SubredditSections = React.createClass({
  render(){
    var props = this.props;

    return (
      <div className='subreddit-sections'>
        <SubredditSectionTabs section={props.section} sectionList={props.sectionList} />
        <SubredditSectionPosts posts={props.posts} />
      </div>
    );
  }
});

/**
 * Container for representation of obtained Subreddit data
 */
var SubredditContent = React.createClass({
  render(){
    return (
      <div>
        <SubredditHeader {...this.props.about} />

        <div className='row'>
          <SubredditSections {...this.props} />
        </div>
      </div>
    );
  }
});

/**
 * Output Subreddit component
 */
module.exports = React.createClass({

  mixins: [ Reflux.listenTo( subredditStore, "_onLoadSubreddit" ) ],

  _getActiveComponent( state ){
    switch ( state ){
      case states.SUBREDDIT_PENDING: return <PendingAlert />;
      case states.SUBREDDIT_READY: return <SubredditContent {...this.state}/>;
      case states.SUBREDDIT_FAILED:
        var message = config.alerts.failedLoadSubreddit.replace('%s', this.props.name );
        return <InvalidAlert message={message} />;
    }
  },

  _onLoadSubreddit: function( state ){
    this.setState( state );
  },

  getInitialState(){
    return subredditStore.getCurrentState();
  },

  componentWillMount(){
    subredditActions.load( this.props.name );
  },

  render(){
    var activeComponent = this._getActiveComponent( this.state.state );

    return (
      <div className='subreddit'>
        {activeComponent}
      </div>
    );
  }
});