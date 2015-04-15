function ServiceWorkerAdapter( path ){
  // init serviceWorker
  navigator.serviceWorker
           .register( path )
           .then( this.onInstall.bind( this ) )
           .catch( this.onFail.bind( this ) );
}

ServiceWorkerAdapter.prototype = {
  constructor: ServiceWorkerAdapter,

  onInstall: function( registration ){
    console.log('ServiceWorker registration successful', registration);
  },

  onFail: function( error ){
    console.error('ServiceWorker registration failed: ', error);
  }
};

ServiceWorkerAdapter.isSupported = function(){
  return !! navigator.serviceWorker;
};

module.exports = ServiceWorkerAdapter;