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
  render(){
    var current = this.props.section,
        handler = this.props.onSelectSection;

    // build tab list
    var sectionList = this.props.sectionList.map(( section, i ) => {
      var classes = classnames({ active: section === current });

      return (
        <li key={i} className={classes}>
          <a href="#" data-section={section} onClick={handler}>{section}</a>
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
  getFormattedDate( unixSecs ){
    var date = new Date( unixSecs * 1000 );

    var day    = date.getDate(),
        mounth = date.getMonth(),
        year   = date.getFullYear();

    return ( day < 10 ? '0' + day : day ) + "." + ( mounth < 10 ? '0' + mounth : mounth ) + "." + year;
  },

  render(){
    var onSelectPost = this.props.onSelectPost;

    var posts = this.props.posts.map(( post, i ) => {
      return (
        <div key={i} className='subreddit-post-item'>
          <h4><a href={post.url} target='_blank'>{post.title}</a></h4>
          <p>
            Created: <i>{this.getFormattedDate(post.created)}</i>,
            author: <i>{post.author}</i>
            <span className='post-view'>
              <a href='#' data-post-index={i} onClick={onSelectPost}>view</a>
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

var SubredditPost = React.createClass({

  render(){
    var props = this.props,
        text;

    text = props.text ? <p class>{props.text}</p> : null;

    return (
      <div className='subreddit-post'>
        <div className='subreddit-post-header'>
          <h4>{props.title}</h4>
        </div>
        <div className='body'>
          {text}
          <div className='comments'>
            <div className='comments-header'>
              <strong>Comments</strong>
            </div>
            <div className='comments-list'>
          </div>
          </div>
        </div>
      </div>
    );
  }
});


var SubredditSections = React.createClass({
  _getStateComponent( state ){
    var props = this.props;

    switch ( state ){
      case states.SUBREDDIT_SECTION_PENDING: return <PendingAlert />;
      case states.SUBREDDIT_READY:
        return <SubredditSectionPosts posts={props.posts} onSelectPost={this.onSelectPost} />;
      case states.SUBREDDIT_POST_VIEW:
        return <SubredditPost {...this.props.posts[this.props.selectedPost]} />;
      case states.SUBREDDIT_SECTION_FAILED:
        var message = config.alerts.failedLoadSubreddit.replace('%s', props.name );
        return <InvalidAlert message={message} />;
    }
  },

  onSelectSection( event ){
    event.preventDefault();

    var section = event.target.dataset.section,
        props   = this.props;

    if ( props.section !== section ){
      subredditActions.loadSection( props.name, section );
    }
  },

  onSelectPost( event ){
    event.preventDefault();

    var index = event.target.dataset.postIndex;

    subredditActions.selectPost( index );
  },

  render(){
    var props = this.props;

    return (
      <div className='subreddit-sections'>
        <SubredditSectionTabs
            section={props.section}
            sectionList={props.sectionList}
            onSelectSection={this.onSelectSection}/>
        {this._getStateComponent(props.state)}
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

  _getStateComponent( state ){
    switch ( state ){
      case states.SUBREDDIT_PENDING: return <PendingAlert />;
      case states.SUBREDDIT_READY:
      case states.SUBREDDIT_SECTION_PENDING:
      case states.SUBREDDIT_POST_VIEW:
        return <SubredditContent {...this.state} name={this.props.name}/>;
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
    return (
      <div className='subreddit'>
        {this._getStateComponent( this.state.state )}
      </div>
    );
  }
});