if ( ! navigator.serviceWorker ){
  throw new Error( "Current browser doesn't support this app" );
}

// init serviceWorker
navigator.serviceWorker
         .register( 'service-worker.js' )
         .then( onServiceWorkerInstall )
         .catch( onServiceWorkerFail );

/**
 * Process registered serviceWorker
 * @param registration
 */
function onServiceWorkerInstall( registration ){
  console.log('ServiceWorker registration successful', registration);
}

/**
 * Process serviceWorker fail
 * @param error
 */
function onServiceWorkerFail( error ){
  console.error('ServiceWorker registration failed: ', error);
}