var ServiceWorkerAdapter = require('./utils/ServiceWorkerAdapter');
var reddit = require('./utils/RedditAdapter');

// check Service Worker support
if ( ! ServiceWorkerAdapter.isSupported() ){
  throw new Error( "Current browser doesn't support this app" );
}

// init Service Worker
var serviceWorker = new ServiceWorkerAdapter( 'service-worker.js' );

// init reddit
reddit.hot('javascript').limit(25).fetch(function( response ){
  var articles = response.data.children.slice(1);

  articles = articles.map(function( item ){
    var data = item.data;

    return {
      title: data.title,
      author: data.author,
      url: data.url,
      created: data.created
    }
  });

  console.log( articles );
});