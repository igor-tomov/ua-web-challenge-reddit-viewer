var serviceWorkerConfig = require('./config/serviceWorker');

if ( serviceWorkerConfig.enabled ){
  var ServiceWorkerAdapter = require('./utils/ServiceWorkerAdapter');

  // check Service Worker support
  if ( ! ServiceWorkerAdapter.isSupported() ){
    throw new Error( "Current browser doesn't support this app" );
  }

  // init Service Worker
  new ServiceWorkerAdapter( 'service-worker.js' );
}


// Init app
var React        = require('react'),
    RedditViewer = require('./components/RedditViewer.react');


React.render( React.createElement( RedditViewer ), document.getElementById('app-root') );


/*var Subreddit = require('./stores/models/subreddits');
var subreddit = new Subreddit( 'java' );
var reactRouter = require('react-router');
console.log( "reactRouter:", reactRouter );

subreddit.about()
         .then(function( data ){
            console.log( subreddit.name, data );
         })
         .catch(function( errorCode ){
            switch ( errorCode ){
              case 403: console.warn( "Subreddit isn't accessible. Probably, it might be a private" ); break;
              case 404: console.warn( "Subreddit '%s' isn't found", subreddit.name ); break;
            }
         });

subreddit.posts( "hot" )
          .then(function( data ){
            console.log( "Posts: ", data );
          })
          .catch(function( error ){
            console.log( "Posts error: ", error );
          });*/
