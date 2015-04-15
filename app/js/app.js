var ServiceWorkerAdapter = require('./utils/ServiceWorkerAdapter');

// check Service Worker service worker support
if ( ! ServiceWorkerAdapter.isSupported() ){
  throw new Error( "Current browser doesn't support this app" );
}

// init Service Worker
var serviceWorker = new ServiceWorkerAdapter( 'service-worker.js' );

//