var Reflux           = require('reflux'),
    SubredditService = require('../services/SubredditService');

var subredditActions = Reflux.createActions([
  "load",
  "loadCompleted",
  "loadFailed",

  "selectSection",
  "loadSectionCompleted",
  "loadSectionFailed",

  "selectPost",
  "backToSection"
]);

// Trigger Subreddit loading
subredditActions.load.preEmit = function( name ){
  var subreddit = new SubredditService( name ),
      section   = subreddit.firstSection();

  if ( ! section ){
    throw new Error( "Subreddit sections is not defined" );
  }

  Promise.all( [subreddit.about(), subreddit.sections(), subreddit.posts( section )] )
         .then( subredditActions.loadCompleted )
         .catch( subredditActions.loadFailed );
};

// Trigger Subreddit section loading
subredditActions.selectSection.preEmit = function( name, section ){
  var subreddit = new SubredditService( name ),
      sections  = subreddit.sections();

  if ( sections.indexOf( section ) === -1 ){
    throw new Error( section + " isn't defined" );
  }

  subreddit.posts( section )
           .then( subredditActions.loadSectionCompleted )
           .catch( subredditActions.loadSectionFailed );
};

module.exports = subredditActions;