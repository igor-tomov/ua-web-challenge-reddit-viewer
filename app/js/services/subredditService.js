var config  = require('../config/reddit'),
    reddit  = require('../utils/RedditAdapter'),
    Promise = require('promise-es6').Promise;

/**
 * Provides facade API for dealing with Reddit.js
 *
 * @param {String} name
 * @constructor
 */
function Subreddit( name ){
  this.name = name.toString().trim();
}

Subreddit.prototype = {
  constructor: Subreddit,

  SECTIONS: config.sections,

  /**
   * Build output "about" data
   *
   * @param data
   * @returns {Object}
   * @private
   */
  _prepareAbout: function( data ){
    return {
      title: data.title,
      description: data.public_description,
      thumbnail: data.header_img,
      url: config.baseURL + data.url
    }
  },

  /**
   * Build output posts data
   *
   * @param {Array} posts
   * @param {Array} [comments]
   * @param {String} [section]
   * @returns {Array}
   *
   * @private
   */
  _preparePosts: function( posts, comments, section ){
    comments = comments || [];

    if ( section ){
      posts.sectionName = section;
    }

    return posts.map(function( item, i ){
      var data = item.data;

      return {
        title: data.title,
        author: data.author,
        url: data.url,
        created: data.created,
        text: data.selftext,
        comments: comments[i] || []
      }
    });
  },

  /**
   * Fetch description of current subreddit
   */
  about: function(){
    return new Promise(function( resolve, reject ){
      reddit.about( this.name ).fetch(
        function( response ){
          var data = response.data;

          if ( data ) {
            resolve( this._prepareAbout( data ) );
          }else{//some error has been occurred
            reject( response.error );
          }
        }.bind(this),
        function( error ){
          reject( error || 404 );
        }
      );
    }.bind(this));
  },

  /**
   * Get copy of section list
   *
   * @returns {Array}
   */
  sections: function(){
    return this.SECTIONS.slice();
  },

  /**
   * Get first item from section list
   *
   * @return {String}
   */
  firstSection: function(){
    return this.SECTIONS.slice( 0, 1 )[0];
  },

  /**
   * Fetch post list with comments for supplied section
   *
   * @param {String} section
   */
  posts: function( section ){
    return new Promise(function( resolve, reject ){
      var self = this;

      if ( this.SECTIONS.indexOf( section ) === -1 || ! reddit[section] ){ // invalid supplied section
        console.warn( "Subreddit section '%s' is undefined", section );
        reject( 404 );

        return;
      }

      reddit[section]( this.name )
            .limit( config.postLimit )
            .fetch(
              function( response ){
                var data = response.data,
                    posts, comments;

                if ( ! data ) {//some error has been occurred
                  resolve( response.error );
                  return;
                }

                //retrieve post data
                posts = data.children;

                if ( ! posts || posts.length < 1 ){// post list is empty
                  resolve( [] );
                }

                // fetch comments for obtained posts
                comments = [];

                posts.forEach(function( item ){
                  comments.push( self.comments( item.data.id ) );
                });

                Promise.all( comments ).then(
                  function( comments ){
                    resolve( self._preparePosts( posts, comments, section ) );
                  },

                  // error
                  function( error ){
                    reject( error );
                  }
                );

              },
              function( error ){
                reject( error || 404 );
              }
            );
    }.bind(this));
  },

  /**
   * Fetch comments for supplied post
   *
   * @param {String} postId
   */
  comments: function( postId ){
    return new Promise(function( resolve ){
      reddit.comments( postId, this.name )
            .fetch(
              function( response ){
                resolve( response );
              },
              function( error ){
                console.warn( "Failed to fetch comments for '%s' post", postId, error );

                // resolve this error in order to prevent the rejection of Promise.all within posts()
                resolve( false );
              }
            );
    }.bind(this));
  }
};

module.exports = Subreddit;