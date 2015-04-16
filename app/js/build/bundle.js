(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./utils/RedditAdapter":2,"./utils/ServiceWorkerAdapter":3}],2:[function(require,module,exports){
// Browserify adapter for Reddit.js, https://github.com/sahilm/reddit.js
// which is doesn't support CommonJS
var reddit = require('reddit.js');

if ( ! reddit || ! Object.keys( reddit ).length ){
  reddit = window.reddit;
}

module.exports = reddit;
},{"reddit.js":4}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
/**
 * Reddit API wrapper for the browser (https://git.io/Mw39VQ)
 * @author Sahil Muthoo <sahil.muthoo@gmail.com> (https://www.sahilm.com)
 * @license MIT
 */
!function(window){"use strict";function listing(on,extras){return extras=extras||[],withFilters(on,["after","before","count","limit","show"].concat(extras))}function fetch(on){return{fetch:function(res,err){getJSON(redditUrl(on),res,err)}}}function withFilters(on,filters){var ret={};on.params=on.params||{},filters=filters||[];for(var without=function(object,key){var ret={};for(var prop in object)object.hasOwnProperty(prop)&&prop!==key&&(ret[prop]=object[prop]);return ret},filter=function(f){return"show"===f?function(){return on.params[f]="all",without(this,f)}:function(arg){return on.params[f]=arg,without(this,f)}},i=0;i<filters.length;i++)ret[filters[i]]=filter(filters[i]);return ret.fetch=function(res,err){getJSON(redditUrl(on),res,err)},ret}function redditUrl(on){var url="http://www.reddit.com/",keys=function(object){var ret=[];for(var prop in object)object.hasOwnProperty(prop)&&ret.push(prop);return ret};if(void 0!==on.subreddit&&(url+="r/"+on.subreddit+"/"),url+=on.resource+".json",keys(on.params).length>0){var qs=[];for(var param in on.params)on.params.hasOwnProperty(param)&&qs.push(encodeURIComponent(param)+"="+encodeURIComponent(on.params[param]));url+="?"+qs.join("&")}return url}function getJSON(url,res,err){get(url,function(data){res(JSON.parse(data))},err)}function get(url,res,err){var xhr=new XMLHttpRequest;xhr.open("GET",url,!0),xhr.onload=function(){return res(xhr.response)},xhr.onerror=function(){return void 0!==err?err(xhr.response):void 0},xhr.send()}var reddit=window.reddit={};reddit.hot=function(subreddit){return listing({subreddit:subreddit,resource:"hot"})},reddit.top=function(subreddit){return listing({subreddit:subreddit,resource:"top"},["t"])},reddit.controversial=function(subreddit){return listing({subreddit:subreddit,resource:"controversial"},["t"])},reddit.new=function(subreddit){return listing({subreddit:subreddit,resource:"new"})},reddit.about=function(subreddit){return fetch({subreddit:subreddit,resource:"about"})},reddit.random=function(subreddit){return fetch({subreddit:subreddit,resource:"random"})},reddit.info=function(subreddit){var on={subreddit:subreddit,resource:"api/info"};return withFilters(on,["id","limit","url"])},reddit.comments=function(article,subreddit){var on={subreddit:subreddit,resource:"comments/"+article};return withFilters(on,["comment","context","depth","limit","sort"])},reddit.recommendedSubreddits=function(srnames){var on={resource:"api/recommend/sr/"+srnames};return withFilters(on,["omit"])},reddit.subredditsByTopic=function(query){var on={resource:"api/subreddits_by_topic",params:{query:query}};return fetch(on)},reddit.search=function(query,subreddit){var on={subreddit:subreddit,resource:"search",params:{q:query}};return withFilters(on,["after","before","count","limit","restrict_sr","show","sort","syntax","t"])},reddit.searchSubreddits=function(query){return listing({resource:"subreddits/search",params:{q:query}})},reddit.popularSubreddits=function(){return listing({resource:"subreddits/popular"})},reddit.newSubreddits=function(){return listing({resource:"subreddits/new"})},reddit.aboutUser=function(username){return fetch({resource:"user/"+username+"/about"})}}(window);
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvanMvYXBwLmpzIiwiYXBwL2pzL3V0aWxzL1JlZGRpdEFkYXB0ZXIuanMiLCJhcHAvanMvdXRpbHMvU2VydmljZVdvcmtlckFkYXB0ZXIuanMiLCJub2RlX21vZHVsZXMvcmVkZGl0LmpzL3JlZGRpdC5taW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFNlcnZpY2VXb3JrZXJBZGFwdGVyID0gcmVxdWlyZSgnLi91dGlscy9TZXJ2aWNlV29ya2VyQWRhcHRlcicpO1xyXG52YXIgcmVkZGl0ID0gcmVxdWlyZSgnLi91dGlscy9SZWRkaXRBZGFwdGVyJyk7XHJcblxyXG4vLyBjaGVjayBTZXJ2aWNlIFdvcmtlciBzdXBwb3J0XHJcbmlmICggISBTZXJ2aWNlV29ya2VyQWRhcHRlci5pc1N1cHBvcnRlZCgpICl7XHJcbiAgdGhyb3cgbmV3IEVycm9yKCBcIkN1cnJlbnQgYnJvd3NlciBkb2Vzbid0IHN1cHBvcnQgdGhpcyBhcHBcIiApO1xyXG59XHJcblxyXG4vLyBpbml0IFNlcnZpY2UgV29ya2VyXHJcbnZhciBzZXJ2aWNlV29ya2VyID0gbmV3IFNlcnZpY2VXb3JrZXJBZGFwdGVyKCAnc2VydmljZS13b3JrZXIuanMnICk7XHJcblxyXG4vLyBpbml0IHJlZGRpdFxyXG5yZWRkaXQuYWJvdXQoJ2phdmFzY3JpcHQnKS5mZXRjaChmdW5jdGlvbihyZXNwb25zZSl7XHJcbiAgY29uc29sZS5sb2coIFwiYWJvdXQ6XCIsIHJlc3BvbnNlICk7XHJcbn0pO1xyXG5cclxucmVkZGl0LmhvdCgnamF2YXNjcmlwdCcpLmxpbWl0KDI1KS5mZXRjaChmdW5jdGlvbiggcmVzcG9uc2UgKXtcclxuICB2YXIgYXJ0aWNsZXMgPSByZXNwb25zZS5kYXRhLmNoaWxkcmVuLnNsaWNlKDEpO1xyXG5cclxuICAvLyBmZXRjaCBjb21tZW50cyBmb3IgZWFjaCBhcnRpY2xlIGluIHRhcmdldCBzdWJyZWRkaXRcclxuICB2YXIgY29tbWVudHMgPSBbXTtcclxuXHJcbiAgYXJ0aWNsZXMuZm9yRWFjaChmdW5jdGlvbiggaXRlbSApe1xyXG4gICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiggcmVzb2x2ZSApe1xyXG4gICAgICByZWRkaXQuY29tbWVudHMoIGl0ZW0uZGF0YS5pZCwgJ2phdmFzY3JpcHQnICkuc29ydCggXCJob3RcIiApLmZldGNoKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICByZXNvbHZlKCByZXNwb25zZSApO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbW1lbnRzLnB1c2goIHByb21pc2UgKTtcclxuICB9KTtcclxuXHJcbiAgLy8gUmVkdWNlIGFydGljbGVzIGRhdGFcclxuICBQcm9taXNlLmFsbCggY29tbWVudHMgKS50aGVuKGZ1bmN0aW9uKCBjb21tZW50cyApe1xyXG4gICAgYXJ0aWNsZXMgPSBhcnRpY2xlcy5tYXAoZnVuY3Rpb24oIGl0ZW0sIGkgKXtcclxuICAgICAgdmFyIGRhdGEgPSBpdGVtLmRhdGE7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHRpdGxlOiBkYXRhLnRpdGxlLFxyXG4gICAgICAgIGF1dGhvcjogZGF0YS5hdXRob3IsXHJcbiAgICAgICAgdXJsOiBkYXRhLnVybCxcclxuICAgICAgICBjcmVhdGVkOiBkYXRhLmNyZWF0ZWQsXHJcbiAgICAgICAgY29tbWVudHM6IGNvbW1lbnRzW2ldXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCBhcnRpY2xlcyApO1xyXG4gIH0pO1xyXG59KTsiLCIvLyBCcm93c2VyaWZ5IGFkYXB0ZXIgZm9yIFJlZGRpdC5qcywgaHR0cHM6Ly9naXRodWIuY29tL3NhaGlsbS9yZWRkaXQuanNcclxuLy8gd2hpY2ggaXMgZG9lc24ndCBzdXBwb3J0IENvbW1vbkpTXHJcbnZhciByZWRkaXQgPSByZXF1aXJlKCdyZWRkaXQuanMnKTtcclxuXHJcbmlmICggISByZWRkaXQgfHwgISBPYmplY3Qua2V5cyggcmVkZGl0ICkubGVuZ3RoICl7XHJcbiAgcmVkZGl0ID0gd2luZG93LnJlZGRpdDtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZWRkaXQ7IiwiZnVuY3Rpb24gU2VydmljZVdvcmtlckFkYXB0ZXIoIHBhdGggKXtcclxuICAvLyBpbml0IHNlcnZpY2VXb3JrZXJcclxuICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlclxyXG4gICAgICAgICAgIC5yZWdpc3RlciggcGF0aCApXHJcbiAgICAgICAgICAgLnRoZW4oIHRoaXMub25JbnN0YWxsLmJpbmQoIHRoaXMgKSApXHJcbiAgICAgICAgICAgLmNhdGNoKCB0aGlzLm9uRmFpbC5iaW5kKCB0aGlzICkgKTtcclxufVxyXG5cclxuU2VydmljZVdvcmtlckFkYXB0ZXIucHJvdG90eXBlID0ge1xyXG4gIGNvbnN0cnVjdG9yOiBTZXJ2aWNlV29ya2VyQWRhcHRlcixcclxuXHJcbiAgb25JbnN0YWxsOiBmdW5jdGlvbiggcmVnaXN0cmF0aW9uICl7XHJcbiAgICBjb25zb2xlLmxvZygnU2VydmljZVdvcmtlciByZWdpc3RyYXRpb24gc3VjY2Vzc2Z1bCcsIHJlZ2lzdHJhdGlvbik7XHJcbiAgfSxcclxuXHJcbiAgb25GYWlsOiBmdW5jdGlvbiggZXJyb3IgKXtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1NlcnZpY2VXb3JrZXIgcmVnaXN0cmF0aW9uIGZhaWxlZDogJywgZXJyb3IpO1xyXG4gIH1cclxufTtcclxuXHJcblNlcnZpY2VXb3JrZXJBZGFwdGVyLmlzU3VwcG9ydGVkID0gZnVuY3Rpb24oKXtcclxuICByZXR1cm4gISEgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZpY2VXb3JrZXJBZGFwdGVyOyIsIi8qKlxuICogUmVkZGl0IEFQSSB3cmFwcGVyIGZvciB0aGUgYnJvd3NlciAoaHR0cHM6Ly9naXQuaW8vTXczOVZRKVxuICogQGF1dGhvciBTYWhpbCBNdXRob28gPHNhaGlsLm11dGhvb0BnbWFpbC5jb20+IChodHRwczovL3d3dy5zYWhpbG0uY29tKVxuICogQGxpY2Vuc2UgTUlUXG4gKi9cbiFmdW5jdGlvbih3aW5kb3cpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGxpc3Rpbmcob24sZXh0cmFzKXtyZXR1cm4gZXh0cmFzPWV4dHJhc3x8W10sd2l0aEZpbHRlcnMob24sW1wiYWZ0ZXJcIixcImJlZm9yZVwiLFwiY291bnRcIixcImxpbWl0XCIsXCJzaG93XCJdLmNvbmNhdChleHRyYXMpKX1mdW5jdGlvbiBmZXRjaChvbil7cmV0dXJue2ZldGNoOmZ1bmN0aW9uKHJlcyxlcnIpe2dldEpTT04ocmVkZGl0VXJsKG9uKSxyZXMsZXJyKX19fWZ1bmN0aW9uIHdpdGhGaWx0ZXJzKG9uLGZpbHRlcnMpe3ZhciByZXQ9e307b24ucGFyYW1zPW9uLnBhcmFtc3x8e30sZmlsdGVycz1maWx0ZXJzfHxbXTtmb3IodmFyIHdpdGhvdXQ9ZnVuY3Rpb24ob2JqZWN0LGtleSl7dmFyIHJldD17fTtmb3IodmFyIHByb3AgaW4gb2JqZWN0KW9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSYmcHJvcCE9PWtleSYmKHJldFtwcm9wXT1vYmplY3RbcHJvcF0pO3JldHVybiByZXR9LGZpbHRlcj1mdW5jdGlvbihmKXtyZXR1cm5cInNob3dcIj09PWY/ZnVuY3Rpb24oKXtyZXR1cm4gb24ucGFyYW1zW2ZdPVwiYWxsXCIsd2l0aG91dCh0aGlzLGYpfTpmdW5jdGlvbihhcmcpe3JldHVybiBvbi5wYXJhbXNbZl09YXJnLHdpdGhvdXQodGhpcyxmKX19LGk9MDtpPGZpbHRlcnMubGVuZ3RoO2krKylyZXRbZmlsdGVyc1tpXV09ZmlsdGVyKGZpbHRlcnNbaV0pO3JldHVybiByZXQuZmV0Y2g9ZnVuY3Rpb24ocmVzLGVycil7Z2V0SlNPTihyZWRkaXRVcmwob24pLHJlcyxlcnIpfSxyZXR9ZnVuY3Rpb24gcmVkZGl0VXJsKG9uKXt2YXIgdXJsPVwiaHR0cDovL3d3dy5yZWRkaXQuY29tL1wiLGtleXM9ZnVuY3Rpb24ob2JqZWN0KXt2YXIgcmV0PVtdO2Zvcih2YXIgcHJvcCBpbiBvYmplY3Qpb2JqZWN0Lmhhc093blByb3BlcnR5KHByb3ApJiZyZXQucHVzaChwcm9wKTtyZXR1cm4gcmV0fTtpZih2b2lkIDAhPT1vbi5zdWJyZWRkaXQmJih1cmwrPVwici9cIitvbi5zdWJyZWRkaXQrXCIvXCIpLHVybCs9b24ucmVzb3VyY2UrXCIuanNvblwiLGtleXMob24ucGFyYW1zKS5sZW5ndGg+MCl7dmFyIHFzPVtdO2Zvcih2YXIgcGFyYW0gaW4gb24ucGFyYW1zKW9uLnBhcmFtcy5oYXNPd25Qcm9wZXJ0eShwYXJhbSkmJnFzLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtKStcIj1cIitlbmNvZGVVUklDb21wb25lbnQob24ucGFyYW1zW3BhcmFtXSkpO3VybCs9XCI/XCIrcXMuam9pbihcIiZcIil9cmV0dXJuIHVybH1mdW5jdGlvbiBnZXRKU09OKHVybCxyZXMsZXJyKXtnZXQodXJsLGZ1bmN0aW9uKGRhdGEpe3JlcyhKU09OLnBhcnNlKGRhdGEpKX0sZXJyKX1mdW5jdGlvbiBnZXQodXJsLHJlcyxlcnIpe3ZhciB4aHI9bmV3IFhNTEh0dHBSZXF1ZXN0O3hoci5vcGVuKFwiR0VUXCIsdXJsLCEwKSx4aHIub25sb2FkPWZ1bmN0aW9uKCl7cmV0dXJuIHJlcyh4aHIucmVzcG9uc2UpfSx4aHIub25lcnJvcj1mdW5jdGlvbigpe3JldHVybiB2b2lkIDAhPT1lcnI/ZXJyKHhoci5yZXNwb25zZSk6dm9pZCAwfSx4aHIuc2VuZCgpfXZhciByZWRkaXQ9d2luZG93LnJlZGRpdD17fTtyZWRkaXQuaG90PWZ1bmN0aW9uKHN1YnJlZGRpdCl7cmV0dXJuIGxpc3Rpbmcoe3N1YnJlZGRpdDpzdWJyZWRkaXQscmVzb3VyY2U6XCJob3RcIn0pfSxyZWRkaXQudG9wPWZ1bmN0aW9uKHN1YnJlZGRpdCl7cmV0dXJuIGxpc3Rpbmcoe3N1YnJlZGRpdDpzdWJyZWRkaXQscmVzb3VyY2U6XCJ0b3BcIn0sW1widFwiXSl9LHJlZGRpdC5jb250cm92ZXJzaWFsPWZ1bmN0aW9uKHN1YnJlZGRpdCl7cmV0dXJuIGxpc3Rpbmcoe3N1YnJlZGRpdDpzdWJyZWRkaXQscmVzb3VyY2U6XCJjb250cm92ZXJzaWFsXCJ9LFtcInRcIl0pfSxyZWRkaXQubmV3PWZ1bmN0aW9uKHN1YnJlZGRpdCl7cmV0dXJuIGxpc3Rpbmcoe3N1YnJlZGRpdDpzdWJyZWRkaXQscmVzb3VyY2U6XCJuZXdcIn0pfSxyZWRkaXQuYWJvdXQ9ZnVuY3Rpb24oc3VicmVkZGl0KXtyZXR1cm4gZmV0Y2goe3N1YnJlZGRpdDpzdWJyZWRkaXQscmVzb3VyY2U6XCJhYm91dFwifSl9LHJlZGRpdC5yYW5kb209ZnVuY3Rpb24oc3VicmVkZGl0KXtyZXR1cm4gZmV0Y2goe3N1YnJlZGRpdDpzdWJyZWRkaXQscmVzb3VyY2U6XCJyYW5kb21cIn0pfSxyZWRkaXQuaW5mbz1mdW5jdGlvbihzdWJyZWRkaXQpe3ZhciBvbj17c3VicmVkZGl0OnN1YnJlZGRpdCxyZXNvdXJjZTpcImFwaS9pbmZvXCJ9O3JldHVybiB3aXRoRmlsdGVycyhvbixbXCJpZFwiLFwibGltaXRcIixcInVybFwiXSl9LHJlZGRpdC5jb21tZW50cz1mdW5jdGlvbihhcnRpY2xlLHN1YnJlZGRpdCl7dmFyIG9uPXtzdWJyZWRkaXQ6c3VicmVkZGl0LHJlc291cmNlOlwiY29tbWVudHMvXCIrYXJ0aWNsZX07cmV0dXJuIHdpdGhGaWx0ZXJzKG9uLFtcImNvbW1lbnRcIixcImNvbnRleHRcIixcImRlcHRoXCIsXCJsaW1pdFwiLFwic29ydFwiXSl9LHJlZGRpdC5yZWNvbW1lbmRlZFN1YnJlZGRpdHM9ZnVuY3Rpb24oc3JuYW1lcyl7dmFyIG9uPXtyZXNvdXJjZTpcImFwaS9yZWNvbW1lbmQvc3IvXCIrc3JuYW1lc307cmV0dXJuIHdpdGhGaWx0ZXJzKG9uLFtcIm9taXRcIl0pfSxyZWRkaXQuc3VicmVkZGl0c0J5VG9waWM9ZnVuY3Rpb24ocXVlcnkpe3ZhciBvbj17cmVzb3VyY2U6XCJhcGkvc3VicmVkZGl0c19ieV90b3BpY1wiLHBhcmFtczp7cXVlcnk6cXVlcnl9fTtyZXR1cm4gZmV0Y2gob24pfSxyZWRkaXQuc2VhcmNoPWZ1bmN0aW9uKHF1ZXJ5LHN1YnJlZGRpdCl7dmFyIG9uPXtzdWJyZWRkaXQ6c3VicmVkZGl0LHJlc291cmNlOlwic2VhcmNoXCIscGFyYW1zOntxOnF1ZXJ5fX07cmV0dXJuIHdpdGhGaWx0ZXJzKG9uLFtcImFmdGVyXCIsXCJiZWZvcmVcIixcImNvdW50XCIsXCJsaW1pdFwiLFwicmVzdHJpY3Rfc3JcIixcInNob3dcIixcInNvcnRcIixcInN5bnRheFwiLFwidFwiXSl9LHJlZGRpdC5zZWFyY2hTdWJyZWRkaXRzPWZ1bmN0aW9uKHF1ZXJ5KXtyZXR1cm4gbGlzdGluZyh7cmVzb3VyY2U6XCJzdWJyZWRkaXRzL3NlYXJjaFwiLHBhcmFtczp7cTpxdWVyeX19KX0scmVkZGl0LnBvcHVsYXJTdWJyZWRkaXRzPWZ1bmN0aW9uKCl7cmV0dXJuIGxpc3Rpbmcoe3Jlc291cmNlOlwic3VicmVkZGl0cy9wb3B1bGFyXCJ9KX0scmVkZGl0Lm5ld1N1YnJlZGRpdHM9ZnVuY3Rpb24oKXtyZXR1cm4gbGlzdGluZyh7cmVzb3VyY2U6XCJzdWJyZWRkaXRzL25ld1wifSl9LHJlZGRpdC5hYm91dFVzZXI9ZnVuY3Rpb24odXNlcm5hbWUpe3JldHVybiBmZXRjaCh7cmVzb3VyY2U6XCJ1c2VyL1wiK3VzZXJuYW1lK1wiL2Fib3V0XCJ9KX19KHdpbmRvdyk7Il19
