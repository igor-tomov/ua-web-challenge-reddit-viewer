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
    config       = require('./config'),
    RedditViewer = require('./components/RedditViewer.react');


React.render( React.createElement( RedditViewer, config ), document.getElementById('app-root') );
