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





var Subreddit = require('./stores/models/subreddits');
var subreddit = new Subreddit( 'ssl1' );


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
          });

/*
['hot', 'new', 'top', 'controversial'].forEach(function( section ){

  reddit[ section ]('javascript').limit(25).fetch(function( response ){
    var posts = response.data.children;

    // fetch comments for each article in target subreddit
    var comments = [];

    posts.forEach(function( item ){
      var promise = new Promise(function( resolve ){
        reddit.comments( item.data.id, 'javascript' ).sort( "hot" ).fetch(function( response ) {
          resolve( response );
        });
      });

      comments.push( promise );
    });

    // Reduce articles data
    Promise.all( comments ).then(function( comments ){
      posts = posts.map(function( item, i ){
        var data = item.data;

        return {
          title: data.title,
          author: data.author,
          url: data.url,
          created: data.created,
          comments: comments[i]
        }
      });

      console.log( section, " section: ", posts );
    });
  });
});*/
