var ServiceWorkerAdapter = require('./utils/ServiceWorkerAdapter');
var reddit = require('./utils/RedditAdapter');

// check Service Worker support
if ( ! ServiceWorkerAdapter.isSupported() ){
  throw new Error( "Current browser doesn't support this app" );
}

// init Service Worker
var serviceWorker = new ServiceWorkerAdapter( 'service-worker.js' );

// init reddit
reddit.about('javascript').fetch(function(response){
  console.log( "about:", response );
});

reddit.hot('javascript').limit(25).fetch(function( response ){
  var articles = response.data.children.slice(1);

  // fetch comments for each article in target subreddit
  var comments = [];

  articles.forEach(function( item ){
    var promise = new Promise(function( resolve ){
      reddit.comments( item.data.id, 'javascript' ).sort( "hot" ).fetch(function( response ) {
        resolve( response );
      });
    });

    comments.push( promise );
  });

  // Reduce articles data
  Promise.all( comments ).then(function( comments ){
    articles = articles.map(function( item, i ){
      var data = item.data;

      return {
        title: data.title,
        author: data.author,
        url: data.url,
        created: data.created,
        comments: comments[i]
      }
    });

    console.log( articles );
  });
});