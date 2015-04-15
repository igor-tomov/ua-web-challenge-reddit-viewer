importScripts( "js/polyfill/serviceworker-cache-polyfill.js" );

/**
 * Provide serving and caching of request via ServiceWorker
 *
 * @constructor
 */
function ServiceWorkerManager(){
  // bind handler to ServiceWorker specific events
  self.addEventListener( "install", this.onInstall.bind( this ) );
  self.addEventListener( "activate", this.onActivate.bind( this ) );
  self.addEventListener( "fetch", this.onFetch.bind( this ) );

  console.log("ServiceWorker startup...");
}

ServiceWorkerManager.prototype = {
  CACHE_NAME: 'reddit-api-results',

  onInstall: function(){
    console.log( 'ServiceWorker is installed' );
  },

  onActivate: function( event ){
    console.log( 'ServiceWorker is activated' );

    event.waitUntil( this.clearCache() );
  },

  onFetch: function( event ){
    console.log( "Caught a fetch", event.request.url );

    event.respondWith( this.respond( event.request ) );
  },

  /**
   * Clear old cache data
   */
  clearCache: function(){
    var CACHE_NAME = this.CACHE_NAME;

    return caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if ( CACHE_NAME === cacheName ) {
              var promise = caches.delete(cacheName);

              promise.then(function(){
                console.log( "Cache '%s' has been cleared", cacheName );
              });

              return promise;
            }
          })
        );
      });
  },

  /**
   * Cache and respond to supplied request
   *
   * @param {Request} request
   */
  respond: function( request ){
    var CACHE_NAME = this.CACHE_NAME;

    return caches.match(request)
               .then(function(response){
                  // Cache hit - return response
                  if (response) {
                    return response;
                  }

                  var fetchRequest = request.clone();

                  return fetch(fetchRequest).then(function(response) {
                      // Check if we received a valid response
                      if(!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                      }

                      var responseToCache = response.clone();

                      caches.open(CACHE_NAME)
                            .then(function(cache) {
                              console.log( request.url, " has been successfully cached" );
                              cache.put(request, responseToCache);
                            });

                      return response;
                    });
               });
  }
};


// ##################### start ServiceWorker #####################
new ServiceWorkerManager;
