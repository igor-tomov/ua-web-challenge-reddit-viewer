(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ServiceWorkerAdapter = require('./utils/ServiceWorkerAdapter');

if ( ! ServiceWorkerAdapter.isSupported() ){
  throw new Error( "Current browser doesn't support this app" );
}

var serviceWorker = new ServiceWorkerAdapter( 'service-worker.js' );
},{"./utils/ServiceWorkerAdapter":2}],2:[function(require,module,exports){
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
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvanMvYXBwLmpzIiwiYXBwL2pzL3V0aWxzL1NlcnZpY2VXb3JrZXJBZGFwdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFNlcnZpY2VXb3JrZXJBZGFwdGVyID0gcmVxdWlyZSgnLi91dGlscy9TZXJ2aWNlV29ya2VyQWRhcHRlcicpO1xyXG5cclxuaWYgKCAhIFNlcnZpY2VXb3JrZXJBZGFwdGVyLmlzU3VwcG9ydGVkKCkgKXtcclxuICB0aHJvdyBuZXcgRXJyb3IoIFwiQ3VycmVudCBicm93c2VyIGRvZXNuJ3Qgc3VwcG9ydCB0aGlzIGFwcFwiICk7XHJcbn1cclxuXHJcbnZhciBzZXJ2aWNlV29ya2VyID0gbmV3IFNlcnZpY2VXb3JrZXJBZGFwdGVyKCAnc2VydmljZS13b3JrZXIuanMnICk7IiwiZnVuY3Rpb24gU2VydmljZVdvcmtlckFkYXB0ZXIoIHBhdGggKXtcclxuICAvLyBpbml0IHNlcnZpY2VXb3JrZXJcclxuICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlclxyXG4gICAgICAgICAgIC5yZWdpc3RlciggcGF0aCApXHJcbiAgICAgICAgICAgLnRoZW4oIHRoaXMub25JbnN0YWxsLmJpbmQoIHRoaXMgKSApXHJcbiAgICAgICAgICAgLmNhdGNoKCB0aGlzLm9uRmFpbC5iaW5kKCB0aGlzICkgKTtcclxufVxyXG5cclxuU2VydmljZVdvcmtlckFkYXB0ZXIucHJvdG90eXBlID0ge1xyXG4gIGNvbnN0cnVjdG9yOiBTZXJ2aWNlV29ya2VyQWRhcHRlcixcclxuXHJcbiAgb25JbnN0YWxsOiBmdW5jdGlvbiggcmVnaXN0cmF0aW9uICl7XHJcbiAgICBjb25zb2xlLmxvZygnU2VydmljZVdvcmtlciByZWdpc3RyYXRpb24gc3VjY2Vzc2Z1bCcsIHJlZ2lzdHJhdGlvbik7XHJcbiAgfSxcclxuXHJcbiAgb25GYWlsOiBmdW5jdGlvbiggZXJyb3IgKXtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1NlcnZpY2VXb3JrZXIgcmVnaXN0cmF0aW9uIGZhaWxlZDogJywgZXJyb3IpO1xyXG4gIH1cclxufTtcclxuXHJcblNlcnZpY2VXb3JrZXJBZGFwdGVyLmlzU3VwcG9ydGVkID0gZnVuY3Rpb24oKXtcclxuICByZXR1cm4gISEgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZpY2VXb3JrZXJBZGFwdGVyOyJdfQ==
