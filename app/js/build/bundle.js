(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./config/serviceWorker":3,"./stores/models/subreddits":4,"./utils/ServiceWorkerAdapter":6}],2:[function(require,module,exports){
module.exports = {
  baseURL: 'http://reddit.com',
  postLimit: 25,
  sections: ['hot', 'new', 'top', 'controversial']
};
},{}],3:[function(require,module,exports){
module.exports = {
  enabled: false,
  target: 'service-worker.js'
};
},{}],4:[function(require,module,exports){
var config  = require('../../config/reddit'),
    reddit  = require('../../utils/RedditAdapter'),
    Promise = require('promise-es6').Promise;

/**
 * Model layer which is provides deal with subreddit data
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
   * Build output posts data
   *
   * @param {Array} posts
   * @param {Array} [comments]
   * @returns {Array}
   *
   * @private
   */
  _preparePosts: function( posts, comments ){
    comments = comments || [];

    return posts.map(function( item, i ){
      var data = item.data;

      return {
        title: data.title,
        author: data.author,
        url: data.url,
        created: data.created,
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
            resolve({
              title: data.title,
              description: data.public_description,
              thumbnail: data.header_img,
              url: config.baseURL + data.url
            });
          }else{//some error has been occurred
            reject( response.error );
          }
        },
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
                  reject( response.error );
                  return;
                }

                //retrieve post data
                posts = data.children;

                // fetch comments for obtained posts
                comments = [];

                posts.forEach(function( item ){
                  comments.push( self.comments( item.data.id ) );
                });

                Promise.all( comments ).then(
                  function( comments ){
                    resolve( self._preparePosts( posts, comments ) );
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
},{"../../config/reddit":2,"../../utils/RedditAdapter":5,"promise-es6":11}],5:[function(require,module,exports){
// Browserify adapter for Reddit.js, https://github.com/sahilm/reddit.js
// which is doesn't support CommonJS
var reddit = require('reddit.js');

if ( ! reddit || ! Object.keys( reddit ).length ){
  reddit = window.reddit;
}

module.exports = reddit;
},{"reddit.js":13}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],8:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],9:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],10:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":9,"_process":8,"inherits":7}],11:[function(require,module,exports){

var utils = require('./utils');

// Get a reference to the global scope. We do this instead of using {global}
// in case someone decides to bundle this up and use it in the browser
var _global = (function() { return this; }).call();

// 
// Install the Promise constructor into the global scope, if and only if a
// native promise constructor does not exist.
// 
exports.install = function() {
	if (! _global.Promise) {
		_global.Promise = Promise;
	}
};

// 
// Remove global.Promise, but only if it is our version
// 
exports.uninstall = function() {
	if (_global.Promise && _global.Promise === Promise) {
		_global.Promise = void(0);
		delete _global.Promise;
	}
};

// 
// State constants
// 
var PENDING      = void(0);
var UNFULFILLED  = 0;
var FULFILLED    = 1;
var FAILED       = 2;

// 
// The Promise constructor
// 
// @param {callback} the callback that defines the process to occur
// 
var Promise = exports.Promise = function(callback) {
	// Check that a function argument was given
	if (typeof callback !== 'function') {
		throw new TypeError('Promise constructor takes a function argument');
	}

	// Check that a new instance was created, and not just a function call was made
	if (! (this instanceof Promise)) {
		throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');
	}

	var self = this;

	// The queue of functions waiting for the promise to resolve/reject
	utils.defineProperty(this, 'funcs', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: [ ]
	});

	// The queue of functions waiting for the promise to resolve/reject
	utils.defineProperty(this, 'value', {
		enumerable: false,
		configurable: true,
		writable: false,
		value: void(0)
	});

	// Call the function, passing in the resolve and reject functions
	try {
		callback(resolve, reject);
	} catch (err) {
		reject(err);
	}

	// The {resolve} callback given to the handler function
	function resolve(value) {
		resolvePromise(self, value);
	}

	// The {reject} callback given to the handler function
	function reject(value) {
		rejectPromise(self, value);
	}
};

// --------------------------------------------------------

// 
// Assigns handler function(s) for the resolve/reject events
// 
// @param {onResolve} optional; a function called when the promise resolves
// @param {onReject} optional; a function called when the promise rejects
// @return Promise
// 
Promise.prototype.then = function(onResolve, onReject) {
	var self = this;

	// Create the new promise that will be returned
	var promise = new Promise(function( ) { });

	// If the promise is already completed, call the callback immediately
	if (this.state) {
		setImmediate(function() {
			invokeFunction(self, promise, (self.state === FULFILLED ? onResolve : onReject));
		});
	}

	// Otherwise, add the functions to the list
	else {
		this.funcs.push(promise, onResolve, onReject);
	}

	return promise;
};

// 
// Assigns a handler function for the reject event
// 
// @param {onReject} a function called when the promise rejects
// @return Promise
// 
Promise.prototype.catch = function(onReject) {
	return this.then(null, onReject);
};

// --------------------------------------------------------

// 
// Returns an immediately resolving promise which resolves with {value}. If {value} is
// a thenable, the new promise will instead follow the given thenable.
// 
// @param {value} the value to resolve with
// @return Promise
// 
Promise.resolve = function(value) {
	try {
		var then = utils.thenable(value);
	} catch (err) {
		return new Promise(autoResolve);
	}

	var callback = then
		? function(resolve, reject) {
			then.call(value, resolve, reject);
		}
		: autoResolve;

	function autoResolve(resolve) {
		resolve(value);
	}

	return new Promise(callback);
};

// 
// Returns an immediately rejected promise
// 
// @param {reason} the reason for the rejection
// @return Promise
// 
Promise.reject = function(reason) {
	return new Promise(function(resolve, reject) {
		reject(reason);
	});
};

// 
// Returns a new promise which resolves/rejects based on an array of given promises
// 
// @param {promises} the promises to handle
// @return Promise
// 
Promise.all = function(promises) {
	return new Promise(function(resolve, reject) {
		if (! Array.isArray(promises)) {
			resolve([ ]);
			return;
		}

		var values = [ ];
		var finished = false;
		var remaining = promises.length;
		
		promises.forEach(function(promise, index) {
			var then = utils.thenable(promise);

			if (! then) {
				onResolve(promise);
				return;
			}

			then.call(promise,
				function onResolve(value) {
					remaining--;
					values[index] = value;
					checkIfFinished();
				},
				function onReject(reason) {
					finished = true;
					reject(reason);
				}
			);
		});

		function checkIfFinished() {
			if (! finished && ! remaining) {
				finished = true;
				resolve(values);
			}
		}
	});
};

// 
// Returns a new promise which resolve/rejects as soon as the first given promise resolves
// or rejects
// 
// @param {promises} an array of promises
// @return Promise
// 
Promise.race = function(promises) {
	var promise = new Promise(function() { });

	promises.forEach(function(childPromise) {
		childPromise.then(
			function(value) {
				resolvePromise(promise, value);
			},
			function(value) {
				rejectPromise(promise, value);
			}
		);
	});

	return promise;
};

// --------------------------------------------------------

// 
// Determines how to properly resolve the promise
// 
// @param {promise} the promise
// @param {value} the value to give the promise
// @return void
// 
function resolvePromise(promise, value) {
	if (! handleThenable(promise, value)) {
		fulfillPromise(promise, value);
	}
}

// 
// When a promise resolves with another thenable, this function handles delegating control
// and passing around values
// 
// @param {child} the child promise that values will be passed to
// @param {value} the thenable value from the previous promise
// @return boolean
// 
function handleThenable(promise, value) {
	var done, then;

	// Attempt to get the `then` method from the thenable (if it is a thenable)
	try {
		if (! (then = utils.thenable(value))) {
			return false;
		}
	} catch (err) {
		rejectPromise(promise, err);
		return true;
	}
	
	// Ensure that the promise did not attempt to fulfill with itself
	if (promise === value) {
		rejectPromise(promise, new TypeError('Circular resolution of promises'));
		return true;
	}

	try {
		// Wait for the thenable to fulfill/reject before moving on
		then.call(value,
			function(subValue) {
				if (! done) {
					done = true;

					// Once again look for circular promise resolution
					if (value === subValue) {
						rejectPromise(promise, new TypeError('Circular resolution of promises'));
						return;
					}

					resolvePromise(promise, subValue);
				}
			},
			function(subValue) {
				if (! done) {
					done = true;

					rejectPromise(promise, subValue);
				}
			}
		);
	} catch (err) {
		if (! done) {
			done = true;

			rejectPromise(promise, err);
		}
	}

	return true;
}

// 
// Fulfill the given promise
// 
// @param {promise} the promise to resolve
// @param {value} the value of the promise
// @return void
// 
function fulfillPromise(promise, value) {
	if (promise.state !== PENDING) {return;}

	setValue(promise, value);
	setState(promise, UNFULFILLED);

	setImmediate(function() {
		setState(promise, FULFILLED);
		invokeFunctions(promise);
	});
}

// 
// Reject the given promise
// 
// @param {promise} the promise to reject
// @param {value} the value of the promise
// @return void
// 
function rejectPromise(promise, value) {
	if (promise.state !== PENDING) {return;}

	setValue(promise, value);
	setState(promise, UNFULFILLED);

	setImmediate(function() {
		setState(promise, FAILED);
		invokeFunctions(promise);
	});
}

// 
// Set the state of a promise
// 
// @param {promise} the promise to modify
// @param {state} the new state
// @return void
// 
function setState(promise, state) {
	utils.defineProperty(promise, 'state', {
		enumerable: false,
		// According to the spec: If the state is UNFULFILLED (0), the state can be changed;
		// If the state is FULFILLED (1) or FAILED (2), the state cannot be changed, and therefore we
		// lock the property
		configurable: (! state),
		writable: false,
		value: state
	});
}

// 
// Set the value of a promise
// 
// @param {promise} the promise to modify
// @param {value} the value to store
// @return void
// 
function setValue(promise, value) {
	utils.defineProperty(promise, 'value', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: value
	});
}

// 
// Invoke all existing functions queued up on the promise
// 
// @param {promise} the promise to run functions for
// @return void
// 
function invokeFunctions(promise) {
	var funcs = promise.funcs;

	for (var i = 0, c = funcs.length; i < c; i += 3) {
		invokeFunction(promise, funcs[i], funcs[i + promise.state]);
	}

	// Empty out this list of functions as no one function will be called
	// more than once, and we don't want to hold them in memory longer than needed
	promise.funcs.length = 0;
}

// 
// Invoke one specific function for the promise
// 
// @param {promise} the promise the function belongs too (that .then was called on)
// @param {child} the promise return from the .then call; the next in line
// @param {func} the function to call
// @return void
// 
function invokeFunction(promise, child, func) {
	var value = promise.value;
	var state = promise.state;

	// If we have a function to run, run it
	if (typeof func === 'function') {
		try {
			value = func(value);
		} catch (err) {
			rejectPromise(child, err);
			return;
		}
		
		resolvePromise(child, value);
	}

	else if (state === FULFILLED) {
		resolvePromise(child, value);
	}

	else if (state === FAILED) {
		rejectPromise(child, value);
	}
}

},{"./utils":12}],12:[function(require,module,exports){

var _global = (function() { return this; }).call();

// 
// If the given value is a valid thenable, return the then method; otherwise, return false
// 
exports.thenable = function(value) {
	if (value && (typeof value === 'object' || typeof value === 'function')) {
		try {
			var then = value.then;
		} catch (err) {
			throw err;
		}

		if (typeof then === 'function') {
			return then;
		}
	}

	return false;
}

// 
// Shim Object.defineProperty if needed; This will never run in Node.js land, but
// is here for when we browserify
// 
exports.defineProperty = function(obj, prop, opts) {
	if (Object.defineProperty) {
		try {
			return Object.defineProperty(obj, prop, opts);
		} catch (err) { }
	}
	
	if (opts.value) {
		obj[prop] = opts.value;
	}
};

// 
// setImmediate shim
// 
if (! _global.setImmediate) {
	_global.setImmediate = function(func) {
		setTimeout(func, 0);
	};
}

exports.log = function(obj) {
	console.log(
		require('util').inspect(obj, {
			colors: true,
			showHidden: true,
			depth: 2
		})
	)
};

},{"util":10}],13:[function(require,module,exports){
/**
 * Reddit API wrapper for the browser (https://git.io/Mw39VQ)
 * @author Sahil Muthoo <sahil.muthoo@gmail.com> (https://www.sahilm.com)
 * @license MIT
 */
!function(window){"use strict";function listing(on,extras){return extras=extras||[],withFilters(on,["after","before","count","limit","show"].concat(extras))}function fetch(on){return{fetch:function(res,err){getJSON(redditUrl(on),res,err)}}}function withFilters(on,filters){var ret={};on.params=on.params||{},filters=filters||[];for(var without=function(object,key){var ret={};for(var prop in object)object.hasOwnProperty(prop)&&prop!==key&&(ret[prop]=object[prop]);return ret},filter=function(f){return"show"===f?function(){return on.params[f]="all",without(this,f)}:function(arg){return on.params[f]=arg,without(this,f)}},i=0;i<filters.length;i++)ret[filters[i]]=filter(filters[i]);return ret.fetch=function(res,err){getJSON(redditUrl(on),res,err)},ret}function redditUrl(on){var url="http://www.reddit.com/",keys=function(object){var ret=[];for(var prop in object)object.hasOwnProperty(prop)&&ret.push(prop);return ret};if(void 0!==on.subreddit&&(url+="r/"+on.subreddit+"/"),url+=on.resource+".json",keys(on.params).length>0){var qs=[];for(var param in on.params)on.params.hasOwnProperty(param)&&qs.push(encodeURIComponent(param)+"="+encodeURIComponent(on.params[param]));url+="?"+qs.join("&")}return url}function getJSON(url,res,err){get(url,function(data){res(JSON.parse(data))},err)}function get(url,res,err){var xhr=new XMLHttpRequest;xhr.open("GET",url,!0),xhr.onload=function(){return res(xhr.response)},xhr.onerror=function(){return void 0!==err?err(xhr.response):void 0},xhr.send()}var reddit=window.reddit={};reddit.hot=function(subreddit){return listing({subreddit:subreddit,resource:"hot"})},reddit.top=function(subreddit){return listing({subreddit:subreddit,resource:"top"},["t"])},reddit.controversial=function(subreddit){return listing({subreddit:subreddit,resource:"controversial"},["t"])},reddit.new=function(subreddit){return listing({subreddit:subreddit,resource:"new"})},reddit.about=function(subreddit){return fetch({subreddit:subreddit,resource:"about"})},reddit.random=function(subreddit){return fetch({subreddit:subreddit,resource:"random"})},reddit.info=function(subreddit){var on={subreddit:subreddit,resource:"api/info"};return withFilters(on,["id","limit","url"])},reddit.comments=function(article,subreddit){var on={subreddit:subreddit,resource:"comments/"+article};return withFilters(on,["comment","context","depth","limit","sort"])},reddit.recommendedSubreddits=function(srnames){var on={resource:"api/recommend/sr/"+srnames};return withFilters(on,["omit"])},reddit.subredditsByTopic=function(query){var on={resource:"api/subreddits_by_topic",params:{query:query}};return fetch(on)},reddit.search=function(query,subreddit){var on={subreddit:subreddit,resource:"search",params:{q:query}};return withFilters(on,["after","before","count","limit","restrict_sr","show","sort","syntax","t"])},reddit.searchSubreddits=function(query){return listing({resource:"subreddits/search",params:{q:query}})},reddit.popularSubreddits=function(){return listing({resource:"subreddits/popular"})},reddit.newSubreddits=function(){return listing({resource:"subreddits/new"})},reddit.aboutUser=function(username){return fetch({resource:"user/"+username+"/about"})}}(window);
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvanMvYXBwLmpzIiwiYXBwL2pzL2NvbmZpZy9yZWRkaXQuanMiLCJhcHAvanMvY29uZmlnL3NlcnZpY2VXb3JrZXIuanMiLCJhcHAvanMvc3RvcmVzL21vZGVscy9zdWJyZWRkaXRzLmpzIiwiYXBwL2pzL3V0aWxzL1JlZGRpdEFkYXB0ZXIuanMiLCJhcHAvanMvdXRpbHMvU2VydmljZVdvcmtlckFkYXB0ZXIuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMvcHJvbWlzZS1lczYvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2UtZXM2L2xpYi91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9yZWRkaXQuanMvcmVkZGl0Lm1pbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBzZXJ2aWNlV29ya2VyQ29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcvc2VydmljZVdvcmtlcicpO1xyXG5cclxuaWYgKCBzZXJ2aWNlV29ya2VyQ29uZmlnLmVuYWJsZWQgKXtcclxuICB2YXIgU2VydmljZVdvcmtlckFkYXB0ZXIgPSByZXF1aXJlKCcuL3V0aWxzL1NlcnZpY2VXb3JrZXJBZGFwdGVyJyk7XHJcblxyXG4gIC8vIGNoZWNrIFNlcnZpY2UgV29ya2VyIHN1cHBvcnRcclxuICBpZiAoICEgU2VydmljZVdvcmtlckFkYXB0ZXIuaXNTdXBwb3J0ZWQoKSApe1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCBcIkN1cnJlbnQgYnJvd3NlciBkb2Vzbid0IHN1cHBvcnQgdGhpcyBhcHBcIiApO1xyXG4gIH1cclxuXHJcbiAgLy8gaW5pdCBTZXJ2aWNlIFdvcmtlclxyXG4gIG5ldyBTZXJ2aWNlV29ya2VyQWRhcHRlciggJ3NlcnZpY2Utd29ya2VyLmpzJyApO1xyXG59XHJcblxyXG5cclxuXHJcblxyXG5cclxudmFyIFN1YnJlZGRpdCA9IHJlcXVpcmUoJy4vc3RvcmVzL21vZGVscy9zdWJyZWRkaXRzJyk7XHJcbnZhciBzdWJyZWRkaXQgPSBuZXcgU3VicmVkZGl0KCAnc3NsMScgKTtcclxuXHJcblxyXG5zdWJyZWRkaXQuYWJvdXQoKVxyXG4gICAgICAgICAudGhlbihmdW5jdGlvbiggZGF0YSApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggc3VicmVkZGl0Lm5hbWUsIGRhdGEgKTtcclxuICAgICAgICAgfSlcclxuICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCBlcnJvckNvZGUgKXtcclxuICAgICAgICAgICAgc3dpdGNoICggZXJyb3JDb2RlICl7XHJcbiAgICAgICAgICAgICAgY2FzZSA0MDM6IGNvbnNvbGUud2FybiggXCJTdWJyZWRkaXQgaXNuJ3QgYWNjZXNzaWJsZS4gUHJvYmFibHksIGl0IG1pZ2h0IGJlIGEgcHJpdmF0ZVwiICk7IGJyZWFrO1xyXG4gICAgICAgICAgICAgIGNhc2UgNDA0OiBjb25zb2xlLndhcm4oIFwiU3VicmVkZGl0ICclcycgaXNuJ3QgZm91bmRcIiwgc3VicmVkZGl0Lm5hbWUgKTsgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgfSk7XHJcblxyXG5zdWJyZWRkaXQucG9zdHMoIFwiaG90XCIgKVxyXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oIGRhdGEgKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coIFwiUG9zdHM6IFwiLCBkYXRhICk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCBlcnJvciApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggXCJQb3N0cyBlcnJvcjogXCIsIGVycm9yICk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbi8qXHJcblsnaG90JywgJ25ldycsICd0b3AnLCAnY29udHJvdmVyc2lhbCddLmZvckVhY2goZnVuY3Rpb24oIHNlY3Rpb24gKXtcclxuXHJcbiAgcmVkZGl0WyBzZWN0aW9uIF0oJ2phdmFzY3JpcHQnKS5saW1pdCgyNSkuZmV0Y2goZnVuY3Rpb24oIHJlc3BvbnNlICl7XHJcbiAgICB2YXIgcG9zdHMgPSByZXNwb25zZS5kYXRhLmNoaWxkcmVuO1xyXG5cclxuICAgIC8vIGZldGNoIGNvbW1lbnRzIGZvciBlYWNoIGFydGljbGUgaW4gdGFyZ2V0IHN1YnJlZGRpdFxyXG4gICAgdmFyIGNvbW1lbnRzID0gW107XHJcblxyXG4gICAgcG9zdHMuZm9yRWFjaChmdW5jdGlvbiggaXRlbSApe1xyXG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKCByZXNvbHZlICl7XHJcbiAgICAgICAgcmVkZGl0LmNvbW1lbnRzKCBpdGVtLmRhdGEuaWQsICdqYXZhc2NyaXB0JyApLnNvcnQoIFwiaG90XCIgKS5mZXRjaChmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICByZXNvbHZlKCByZXNwb25zZSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGNvbW1lbnRzLnB1c2goIHByb21pc2UgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlZHVjZSBhcnRpY2xlcyBkYXRhXHJcbiAgICBQcm9taXNlLmFsbCggY29tbWVudHMgKS50aGVuKGZ1bmN0aW9uKCBjb21tZW50cyApe1xyXG4gICAgICBwb3N0cyA9IHBvc3RzLm1hcChmdW5jdGlvbiggaXRlbSwgaSApe1xyXG4gICAgICAgIHZhciBkYXRhID0gaXRlbS5kYXRhO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgdGl0bGU6IGRhdGEudGl0bGUsXHJcbiAgICAgICAgICBhdXRob3I6IGRhdGEuYXV0aG9yLFxyXG4gICAgICAgICAgdXJsOiBkYXRhLnVybCxcclxuICAgICAgICAgIGNyZWF0ZWQ6IGRhdGEuY3JlYXRlZCxcclxuICAgICAgICAgIGNvbW1lbnRzOiBjb21tZW50c1tpXVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBjb25zb2xlLmxvZyggc2VjdGlvbiwgXCIgc2VjdGlvbjogXCIsIHBvc3RzICk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufSk7Ki9cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgYmFzZVVSTDogJ2h0dHA6Ly9yZWRkaXQuY29tJyxcclxuICBwb3N0TGltaXQ6IDI1LFxyXG4gIHNlY3Rpb25zOiBbJ2hvdCcsICduZXcnLCAndG9wJywgJ2NvbnRyb3ZlcnNpYWwnXVxyXG59OyIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGVuYWJsZWQ6IGZhbHNlLFxyXG4gIHRhcmdldDogJ3NlcnZpY2Utd29ya2VyLmpzJ1xyXG59OyIsInZhciBjb25maWcgID0gcmVxdWlyZSgnLi4vLi4vY29uZmlnL3JlZGRpdCcpLFxyXG4gICAgcmVkZGl0ICA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzL1JlZGRpdEFkYXB0ZXInKSxcclxuICAgIFByb21pc2UgPSByZXF1aXJlKCdwcm9taXNlLWVzNicpLlByb21pc2U7XHJcblxyXG4vKipcclxuICogTW9kZWwgbGF5ZXIgd2hpY2ggaXMgcHJvdmlkZXMgZGVhbCB3aXRoIHN1YnJlZGRpdCBkYXRhXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gU3VicmVkZGl0KCBuYW1lICl7XHJcbiAgdGhpcy5uYW1lID0gbmFtZS50b1N0cmluZygpLnRyaW0oKTtcclxufVxyXG5cclxuU3VicmVkZGl0LnByb3RvdHlwZSA9IHtcclxuICBjb25zdHJ1Y3RvcjogU3VicmVkZGl0LFxyXG5cclxuICBTRUNUSU9OUzogY29uZmlnLnNlY3Rpb25zLFxyXG5cclxuICAvKipcclxuICAgKiBCdWlsZCBvdXRwdXQgcG9zdHMgZGF0YVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtBcnJheX0gcG9zdHNcclxuICAgKiBAcGFyYW0ge0FycmF5fSBbY29tbWVudHNdXHJcbiAgICogQHJldHVybnMge0FycmF5fVxyXG4gICAqXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBfcHJlcGFyZVBvc3RzOiBmdW5jdGlvbiggcG9zdHMsIGNvbW1lbnRzICl7XHJcbiAgICBjb21tZW50cyA9IGNvbW1lbnRzIHx8IFtdO1xyXG5cclxuICAgIHJldHVybiBwb3N0cy5tYXAoZnVuY3Rpb24oIGl0ZW0sIGkgKXtcclxuICAgICAgdmFyIGRhdGEgPSBpdGVtLmRhdGE7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHRpdGxlOiBkYXRhLnRpdGxlLFxyXG4gICAgICAgIGF1dGhvcjogZGF0YS5hdXRob3IsXHJcbiAgICAgICAgdXJsOiBkYXRhLnVybCxcclxuICAgICAgICBjcmVhdGVkOiBkYXRhLmNyZWF0ZWQsXHJcbiAgICAgICAgY29tbWVudHM6IGNvbW1lbnRzW2ldIHx8IFtdXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGRlc2NyaXB0aW9uIG9mIGN1cnJlbnQgc3VicmVkZGl0XHJcbiAgICovXHJcbiAgYWJvdXQ6IGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24oIHJlc29sdmUsIHJlamVjdCApe1xyXG4gICAgICByZWRkaXQuYWJvdXQoIHRoaXMubmFtZSApLmZldGNoKFxyXG4gICAgICAgIGZ1bmN0aW9uKCByZXNwb25zZSApe1xyXG4gICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xyXG5cclxuICAgICAgICAgIGlmICggZGF0YSApIHtcclxuICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgdGl0bGU6IGRhdGEudGl0bGUsXHJcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRhdGEucHVibGljX2Rlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICAgIHRodW1ibmFpbDogZGF0YS5oZWFkZXJfaW1nLFxyXG4gICAgICAgICAgICAgIHVybDogY29uZmlnLmJhc2VVUkwgKyBkYXRhLnVybFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1lbHNley8vc29tZSBlcnJvciBoYXMgYmVlbiBvY2N1cnJlZFxyXG4gICAgICAgICAgICByZWplY3QoIHJlc3BvbnNlLmVycm9yICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmdW5jdGlvbiggZXJyb3IgKXtcclxuICAgICAgICAgIHJlamVjdCggZXJyb3IgfHwgNDA0ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBHZXQgY29weSBvZiBzZWN0aW9uIGxpc3RcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIHtBcnJheX1cclxuICAgKi9cclxuICBzZWN0aW9uczogZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiB0aGlzLlNFQ1RJT05TLnNsaWNlKCk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcG9zdCBsaXN0IHdpdGggY29tbWVudHMgZm9yIHN1cHBsaWVkIHNlY3Rpb25cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZWN0aW9uXHJcbiAgICovXHJcbiAgcG9zdHM6IGZ1bmN0aW9uKCBzZWN0aW9uICl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24oIHJlc29sdmUsIHJlamVjdCApe1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBpZiAoIHRoaXMuU0VDVElPTlMuaW5kZXhPZiggc2VjdGlvbiApID09PSAtMSB8fCAhIHJlZGRpdFtzZWN0aW9uXSApeyAvLyBpbnZhbGlkIHN1cHBsaWVkIHNlY3Rpb25cclxuICAgICAgICBjb25zb2xlLndhcm4oIFwiU3VicmVkZGl0IHNlY3Rpb24gJyVzJyBpcyB1bmRlZmluZWRcIiwgc2VjdGlvbiApO1xyXG4gICAgICAgIHJlamVjdCggNDA0ICk7XHJcblxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmVkZGl0W3NlY3Rpb25dKCB0aGlzLm5hbWUgKVxyXG4gICAgICAgICAgICAubGltaXQoIGNvbmZpZy5wb3N0TGltaXQgKVxyXG4gICAgICAgICAgICAuZmV0Y2goXHJcbiAgICAgICAgICAgICAgZnVuY3Rpb24oIHJlc3BvbnNlICl7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zdHMsIGNvbW1lbnRzO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggISBkYXRhICkgey8vc29tZSBlcnJvciBoYXMgYmVlbiBvY2N1cnJlZFxyXG4gICAgICAgICAgICAgICAgICByZWplY3QoIHJlc3BvbnNlLmVycm9yICk7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvL3JldHJpZXZlIHBvc3QgZGF0YVxyXG4gICAgICAgICAgICAgICAgcG9zdHMgPSBkYXRhLmNoaWxkcmVuO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGZldGNoIGNvbW1lbnRzIGZvciBvYnRhaW5lZCBwb3N0c1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBwb3N0cy5mb3JFYWNoKGZ1bmN0aW9uKCBpdGVtICl7XHJcbiAgICAgICAgICAgICAgICAgIGNvbW1lbnRzLnB1c2goIHNlbGYuY29tbWVudHMoIGl0ZW0uZGF0YS5pZCApICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBQcm9taXNlLmFsbCggY29tbWVudHMgKS50aGVuKFxyXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiggY29tbWVudHMgKXtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCBzZWxmLl9wcmVwYXJlUG9zdHMoIHBvc3RzLCBjb21tZW50cyApICk7XHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBlcnJvclxyXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiggZXJyb3IgKXtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoIGVycm9yICk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgZnVuY3Rpb24oIGVycm9yICl7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoIGVycm9yIHx8IDQwNCApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggY29tbWVudHMgZm9yIHN1cHBsaWVkIHBvc3RcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwb3N0SWRcclxuICAgKi9cclxuICBjb21tZW50czogZnVuY3Rpb24oIHBvc3RJZCApe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKCByZXNvbHZlICl7XHJcbiAgICAgIHJlZGRpdC5jb21tZW50cyggcG9zdElkLCB0aGlzLm5hbWUgKVxyXG4gICAgICAgICAgICAuZmV0Y2goXHJcbiAgICAgICAgICAgICAgZnVuY3Rpb24oIHJlc3BvbnNlICl7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCByZXNwb25zZSApO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgZnVuY3Rpb24oIGVycm9yICl7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oIFwiRmFpbGVkIHRvIGZldGNoIGNvbW1lbnRzIGZvciAnJXMnIHBvc3RcIiwgcG9zdElkLCBlcnJvciApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHJlc29sdmUgdGhpcyBlcnJvciBpbiBvcmRlciB0byBwcmV2ZW50IHRoZSByZWplY3Rpb24gb2YgUHJvbWlzZS5hbGwgd2l0aGluIHBvc3RzKClcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoIGZhbHNlICk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN1YnJlZGRpdDsiLCIvLyBCcm93c2VyaWZ5IGFkYXB0ZXIgZm9yIFJlZGRpdC5qcywgaHR0cHM6Ly9naXRodWIuY29tL3NhaGlsbS9yZWRkaXQuanNcclxuLy8gd2hpY2ggaXMgZG9lc24ndCBzdXBwb3J0IENvbW1vbkpTXHJcbnZhciByZWRkaXQgPSByZXF1aXJlKCdyZWRkaXQuanMnKTtcclxuXHJcbmlmICggISByZWRkaXQgfHwgISBPYmplY3Qua2V5cyggcmVkZGl0ICkubGVuZ3RoICl7XHJcbiAgcmVkZGl0ID0gd2luZG93LnJlZGRpdDtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZWRkaXQ7IiwiZnVuY3Rpb24gU2VydmljZVdvcmtlckFkYXB0ZXIoIHBhdGggKXtcclxuICAvLyBpbml0IHNlcnZpY2VXb3JrZXJcclxuICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlclxyXG4gICAgICAgICAgIC5yZWdpc3RlciggcGF0aCApXHJcbiAgICAgICAgICAgLnRoZW4oIHRoaXMub25JbnN0YWxsLmJpbmQoIHRoaXMgKSApXHJcbiAgICAgICAgICAgLmNhdGNoKCB0aGlzLm9uRmFpbC5iaW5kKCB0aGlzICkgKTtcclxufVxyXG5cclxuU2VydmljZVdvcmtlckFkYXB0ZXIucHJvdG90eXBlID0ge1xyXG4gIGNvbnN0cnVjdG9yOiBTZXJ2aWNlV29ya2VyQWRhcHRlcixcclxuXHJcbiAgb25JbnN0YWxsOiBmdW5jdGlvbiggcmVnaXN0cmF0aW9uICl7XHJcbiAgICBjb25zb2xlLmxvZygnU2VydmljZVdvcmtlciByZWdpc3RyYXRpb24gc3VjY2Vzc2Z1bCcsIHJlZ2lzdHJhdGlvbik7XHJcbiAgfSxcclxuXHJcbiAgb25GYWlsOiBmdW5jdGlvbiggZXJyb3IgKXtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1NlcnZpY2VXb3JrZXIgcmVnaXN0cmF0aW9uIGZhaWxlZDogJywgZXJyb3IpO1xyXG4gIH1cclxufTtcclxuXHJcblNlcnZpY2VXb3JrZXJBZGFwdGVyLmlzU3VwcG9ydGVkID0gZnVuY3Rpb24oKXtcclxuICByZXR1cm4gISEgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZpY2VXb3JrZXJBZGFwdGVyOyIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuICAgIHZhciBjdXJyZW50UXVldWU7XG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHZhciBpID0gLTE7XG4gICAgICAgIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtpXSgpO1xuICAgICAgICB9XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbn1cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgcXVldWUucHVzaChmdW4pO1xuICAgIGlmICghZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCJcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxuLy8gR2V0IGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWwgc2NvcGUuIFdlIGRvIHRoaXMgaW5zdGVhZCBvZiB1c2luZyB7Z2xvYmFsfVxuLy8gaW4gY2FzZSBzb21lb25lIGRlY2lkZXMgdG8gYnVuZGxlIHRoaXMgdXAgYW5kIHVzZSBpdCBpbiB0aGUgYnJvd3NlclxudmFyIF9nbG9iYWwgPSAoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KS5jYWxsKCk7XG5cbi8vIFxuLy8gSW5zdGFsbCB0aGUgUHJvbWlzZSBjb25zdHJ1Y3RvciBpbnRvIHRoZSBnbG9iYWwgc2NvcGUsIGlmIGFuZCBvbmx5IGlmIGFcbi8vIG5hdGl2ZSBwcm9taXNlIGNvbnN0cnVjdG9yIGRvZXMgbm90IGV4aXN0LlxuLy8gXG5leHBvcnRzLmluc3RhbGwgPSBmdW5jdGlvbigpIHtcblx0aWYgKCEgX2dsb2JhbC5Qcm9taXNlKSB7XG5cdFx0X2dsb2JhbC5Qcm9taXNlID0gUHJvbWlzZTtcblx0fVxufTtcblxuLy8gXG4vLyBSZW1vdmUgZ2xvYmFsLlByb21pc2UsIGJ1dCBvbmx5IGlmIGl0IGlzIG91ciB2ZXJzaW9uXG4vLyBcbmV4cG9ydHMudW5pbnN0YWxsID0gZnVuY3Rpb24oKSB7XG5cdGlmIChfZ2xvYmFsLlByb21pc2UgJiYgX2dsb2JhbC5Qcm9taXNlID09PSBQcm9taXNlKSB7XG5cdFx0X2dsb2JhbC5Qcm9taXNlID0gdm9pZCgwKTtcblx0XHRkZWxldGUgX2dsb2JhbC5Qcm9taXNlO1xuXHR9XG59O1xuXG4vLyBcbi8vIFN0YXRlIGNvbnN0YW50c1xuLy8gXG52YXIgUEVORElORyAgICAgID0gdm9pZCgwKTtcbnZhciBVTkZVTEZJTExFRCAgPSAwO1xudmFyIEZVTEZJTExFRCAgICA9IDE7XG52YXIgRkFJTEVEICAgICAgID0gMjtcblxuLy8gXG4vLyBUaGUgUHJvbWlzZSBjb25zdHJ1Y3RvclxuLy8gXG4vLyBAcGFyYW0ge2NhbGxiYWNrfSB0aGUgY2FsbGJhY2sgdGhhdCBkZWZpbmVzIHRoZSBwcm9jZXNzIHRvIG9jY3VyXG4vLyBcbnZhciBQcm9taXNlID0gZXhwb3J0cy5Qcm9taXNlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0Ly8gQ2hlY2sgdGhhdCBhIGZ1bmN0aW9uIGFyZ3VtZW50IHdhcyBnaXZlblxuXHRpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignUHJvbWlzZSBjb25zdHJ1Y3RvciB0YWtlcyBhIGZ1bmN0aW9uIGFyZ3VtZW50Jyk7XG5cdH1cblxuXHQvLyBDaGVjayB0aGF0IGEgbmV3IGluc3RhbmNlIHdhcyBjcmVhdGVkLCBhbmQgbm90IGp1c3QgYSBmdW5jdGlvbiBjYWxsIHdhcyBtYWRlXG5cdGlmICghICh0aGlzIGluc3RhbmNlb2YgUHJvbWlzZSkpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdGYWlsZWQgdG8gY29uc3RydWN0IFxcJ1Byb21pc2VcXCc6IFBsZWFzZSB1c2UgdGhlIFxcJ25ld1xcJyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLicpO1xuXHR9XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdC8vIFRoZSBxdWV1ZSBvZiBmdW5jdGlvbnMgd2FpdGluZyBmb3IgdGhlIHByb21pc2UgdG8gcmVzb2x2ZS9yZWplY3Rcblx0dXRpbHMuZGVmaW5lUHJvcGVydHkodGhpcywgJ2Z1bmNzJywge1xuXHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG5cdFx0d3JpdGFibGU6IGZhbHNlLFxuXHRcdHZhbHVlOiBbIF1cblx0fSk7XG5cblx0Ly8gVGhlIHF1ZXVlIG9mIGZ1bmN0aW9ucyB3YWl0aW5nIGZvciB0aGUgcHJvbWlzZSB0byByZXNvbHZlL3JlamVjdFxuXHR1dGlscy5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAndmFsdWUnLCB7XG5cdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxuXHRcdHdyaXRhYmxlOiBmYWxzZSxcblx0XHR2YWx1ZTogdm9pZCgwKVxuXHR9KTtcblxuXHQvLyBDYWxsIHRoZSBmdW5jdGlvbiwgcGFzc2luZyBpbiB0aGUgcmVzb2x2ZSBhbmQgcmVqZWN0IGZ1bmN0aW9uc1xuXHR0cnkge1xuXHRcdGNhbGxiYWNrKHJlc29sdmUsIHJlamVjdCk7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdHJlamVjdChlcnIpO1xuXHR9XG5cblx0Ly8gVGhlIHtyZXNvbHZlfSBjYWxsYmFjayBnaXZlbiB0byB0aGUgaGFuZGxlciBmdW5jdGlvblxuXHRmdW5jdGlvbiByZXNvbHZlKHZhbHVlKSB7XG5cdFx0cmVzb2x2ZVByb21pc2Uoc2VsZiwgdmFsdWUpO1xuXHR9XG5cblx0Ly8gVGhlIHtyZWplY3R9IGNhbGxiYWNrIGdpdmVuIHRvIHRoZSBoYW5kbGVyIGZ1bmN0aW9uXG5cdGZ1bmN0aW9uIHJlamVjdCh2YWx1ZSkge1xuXHRcdHJlamVjdFByb21pc2Uoc2VsZiwgdmFsdWUpO1xuXHR9XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBcbi8vIEFzc2lnbnMgaGFuZGxlciBmdW5jdGlvbihzKSBmb3IgdGhlIHJlc29sdmUvcmVqZWN0IGV2ZW50c1xuLy8gXG4vLyBAcGFyYW0ge29uUmVzb2x2ZX0gb3B0aW9uYWw7IGEgZnVuY3Rpb24gY2FsbGVkIHdoZW4gdGhlIHByb21pc2UgcmVzb2x2ZXNcbi8vIEBwYXJhbSB7b25SZWplY3R9IG9wdGlvbmFsOyBhIGZ1bmN0aW9uIGNhbGxlZCB3aGVuIHRoZSBwcm9taXNlIHJlamVjdHNcbi8vIEByZXR1cm4gUHJvbWlzZVxuLy8gXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24ob25SZXNvbHZlLCBvblJlamVjdCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly8gQ3JlYXRlIHRoZSBuZXcgcHJvbWlzZSB0aGF0IHdpbGwgYmUgcmV0dXJuZWRcblx0dmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiggKSB7IH0pO1xuXG5cdC8vIElmIHRoZSBwcm9taXNlIGlzIGFscmVhZHkgY29tcGxldGVkLCBjYWxsIHRoZSBjYWxsYmFjayBpbW1lZGlhdGVseVxuXHRpZiAodGhpcy5zdGF0ZSkge1xuXHRcdHNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcblx0XHRcdGludm9rZUZ1bmN0aW9uKHNlbGYsIHByb21pc2UsIChzZWxmLnN0YXRlID09PSBGVUxGSUxMRUQgPyBvblJlc29sdmUgOiBvblJlamVjdCkpO1xuXHRcdH0pO1xuXHR9XG5cblx0Ly8gT3RoZXJ3aXNlLCBhZGQgdGhlIGZ1bmN0aW9ucyB0byB0aGUgbGlzdFxuXHRlbHNlIHtcblx0XHR0aGlzLmZ1bmNzLnB1c2gocHJvbWlzZSwgb25SZXNvbHZlLCBvblJlamVjdCk7XG5cdH1cblxuXHRyZXR1cm4gcHJvbWlzZTtcbn07XG5cbi8vIFxuLy8gQXNzaWducyBhIGhhbmRsZXIgZnVuY3Rpb24gZm9yIHRoZSByZWplY3QgZXZlbnRcbi8vIFxuLy8gQHBhcmFtIHtvblJlamVjdH0gYSBmdW5jdGlvbiBjYWxsZWQgd2hlbiB0aGUgcHJvbWlzZSByZWplY3RzXG4vLyBAcmV0dXJuIFByb21pc2Vcbi8vIFxuUHJvbWlzZS5wcm90b3R5cGUuY2F0Y2ggPSBmdW5jdGlvbihvblJlamVjdCkge1xuXHRyZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0KTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFxuLy8gUmV0dXJucyBhbiBpbW1lZGlhdGVseSByZXNvbHZpbmcgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aXRoIHt2YWx1ZX0uIElmIHt2YWx1ZX0gaXNcbi8vIGEgdGhlbmFibGUsIHRoZSBuZXcgcHJvbWlzZSB3aWxsIGluc3RlYWQgZm9sbG93IHRoZSBnaXZlbiB0aGVuYWJsZS5cbi8vIFxuLy8gQHBhcmFtIHt2YWx1ZX0gdGhlIHZhbHVlIHRvIHJlc29sdmUgd2l0aFxuLy8gQHJldHVybiBQcm9taXNlXG4vLyBcblByb21pc2UucmVzb2x2ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHRyeSB7XG5cdFx0dmFyIHRoZW4gPSB1dGlscy50aGVuYWJsZSh2YWx1ZSk7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZShhdXRvUmVzb2x2ZSk7XG5cdH1cblxuXHR2YXIgY2FsbGJhY2sgPSB0aGVuXG5cdFx0PyBmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblx0XHRcdHRoZW4uY2FsbCh2YWx1ZSwgcmVzb2x2ZSwgcmVqZWN0KTtcblx0XHR9XG5cdFx0OiBhdXRvUmVzb2x2ZTtcblxuXHRmdW5jdGlvbiBhdXRvUmVzb2x2ZShyZXNvbHZlKSB7XG5cdFx0cmVzb2x2ZSh2YWx1ZSk7XG5cdH1cblxuXHRyZXR1cm4gbmV3IFByb21pc2UoY2FsbGJhY2spO1xufTtcblxuLy8gXG4vLyBSZXR1cm5zIGFuIGltbWVkaWF0ZWx5IHJlamVjdGVkIHByb21pc2Vcbi8vIFxuLy8gQHBhcmFtIHtyZWFzb259IHRoZSByZWFzb24gZm9yIHRoZSByZWplY3Rpb25cbi8vIEByZXR1cm4gUHJvbWlzZVxuLy8gXG5Qcm9taXNlLnJlamVjdCA9IGZ1bmN0aW9uKHJlYXNvbikge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0cmVqZWN0KHJlYXNvbik7XG5cdH0pO1xufTtcblxuLy8gXG4vLyBSZXR1cm5zIGEgbmV3IHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMvcmVqZWN0cyBiYXNlZCBvbiBhbiBhcnJheSBvZiBnaXZlbiBwcm9taXNlc1xuLy8gXG4vLyBAcGFyYW0ge3Byb21pc2VzfSB0aGUgcHJvbWlzZXMgdG8gaGFuZGxlXG4vLyBAcmV0dXJuIFByb21pc2Vcbi8vIFxuUHJvbWlzZS5hbGwgPSBmdW5jdGlvbihwcm9taXNlcykge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0aWYgKCEgQXJyYXkuaXNBcnJheShwcm9taXNlcykpIHtcblx0XHRcdHJlc29sdmUoWyBdKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgdmFsdWVzID0gWyBdO1xuXHRcdHZhciBmaW5pc2hlZCA9IGZhbHNlO1xuXHRcdHZhciByZW1haW5pbmcgPSBwcm9taXNlcy5sZW5ndGg7XG5cdFx0XG5cdFx0cHJvbWlzZXMuZm9yRWFjaChmdW5jdGlvbihwcm9taXNlLCBpbmRleCkge1xuXHRcdFx0dmFyIHRoZW4gPSB1dGlscy50aGVuYWJsZShwcm9taXNlKTtcblxuXHRcdFx0aWYgKCEgdGhlbikge1xuXHRcdFx0XHRvblJlc29sdmUocHJvbWlzZSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dGhlbi5jYWxsKHByb21pc2UsXG5cdFx0XHRcdGZ1bmN0aW9uIG9uUmVzb2x2ZSh2YWx1ZSkge1xuXHRcdFx0XHRcdHJlbWFpbmluZy0tO1xuXHRcdFx0XHRcdHZhbHVlc1tpbmRleF0gPSB2YWx1ZTtcblx0XHRcdFx0XHRjaGVja0lmRmluaXNoZWQoKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0ZnVuY3Rpb24gb25SZWplY3QocmVhc29uKSB7XG5cdFx0XHRcdFx0ZmluaXNoZWQgPSB0cnVlO1xuXHRcdFx0XHRcdHJlamVjdChyZWFzb24pO1xuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0ZnVuY3Rpb24gY2hlY2tJZkZpbmlzaGVkKCkge1xuXHRcdFx0aWYgKCEgZmluaXNoZWQgJiYgISByZW1haW5pbmcpIHtcblx0XHRcdFx0ZmluaXNoZWQgPSB0cnVlO1xuXHRcdFx0XHRyZXNvbHZlKHZhbHVlcyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn07XG5cbi8vIFxuLy8gUmV0dXJucyBhIG5ldyBwcm9taXNlIHdoaWNoIHJlc29sdmUvcmVqZWN0cyBhcyBzb29uIGFzIHRoZSBmaXJzdCBnaXZlbiBwcm9taXNlIHJlc29sdmVzXG4vLyBvciByZWplY3RzXG4vLyBcbi8vIEBwYXJhbSB7cHJvbWlzZXN9IGFuIGFycmF5IG9mIHByb21pc2VzXG4vLyBAcmV0dXJuIFByb21pc2Vcbi8vIFxuUHJvbWlzZS5yYWNlID0gZnVuY3Rpb24ocHJvbWlzZXMpIHtcblx0dmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbigpIHsgfSk7XG5cblx0cHJvbWlzZXMuZm9yRWFjaChmdW5jdGlvbihjaGlsZFByb21pc2UpIHtcblx0XHRjaGlsZFByb21pc2UudGhlbihcblx0XHRcdGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdHJlc29sdmVQcm9taXNlKHByb21pc2UsIHZhbHVlKTtcblx0XHRcdH0sXG5cdFx0XHRmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRyZWplY3RQcm9taXNlKHByb21pc2UsIHZhbHVlKTtcblx0XHRcdH1cblx0XHQpO1xuXHR9KTtcblxuXHRyZXR1cm4gcHJvbWlzZTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFxuLy8gRGV0ZXJtaW5lcyBob3cgdG8gcHJvcGVybHkgcmVzb2x2ZSB0aGUgcHJvbWlzZVxuLy8gXG4vLyBAcGFyYW0ge3Byb21pc2V9IHRoZSBwcm9taXNlXG4vLyBAcGFyYW0ge3ZhbHVlfSB0aGUgdmFsdWUgdG8gZ2l2ZSB0aGUgcHJvbWlzZVxuLy8gQHJldHVybiB2b2lkXG4vLyBcbmZ1bmN0aW9uIHJlc29sdmVQcm9taXNlKHByb21pc2UsIHZhbHVlKSB7XG5cdGlmICghIGhhbmRsZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKSkge1xuXHRcdGZ1bGZpbGxQcm9taXNlKHByb21pc2UsIHZhbHVlKTtcblx0fVxufVxuXG4vLyBcbi8vIFdoZW4gYSBwcm9taXNlIHJlc29sdmVzIHdpdGggYW5vdGhlciB0aGVuYWJsZSwgdGhpcyBmdW5jdGlvbiBoYW5kbGVzIGRlbGVnYXRpbmcgY29udHJvbFxuLy8gYW5kIHBhc3NpbmcgYXJvdW5kIHZhbHVlc1xuLy8gXG4vLyBAcGFyYW0ge2NoaWxkfSB0aGUgY2hpbGQgcHJvbWlzZSB0aGF0IHZhbHVlcyB3aWxsIGJlIHBhc3NlZCB0b1xuLy8gQHBhcmFtIHt2YWx1ZX0gdGhlIHRoZW5hYmxlIHZhbHVlIGZyb20gdGhlIHByZXZpb3VzIHByb21pc2Vcbi8vIEByZXR1cm4gYm9vbGVhblxuLy8gXG5mdW5jdGlvbiBoYW5kbGVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSkge1xuXHR2YXIgZG9uZSwgdGhlbjtcblxuXHQvLyBBdHRlbXB0IHRvIGdldCB0aGUgYHRoZW5gIG1ldGhvZCBmcm9tIHRoZSB0aGVuYWJsZSAoaWYgaXQgaXMgYSB0aGVuYWJsZSlcblx0dHJ5IHtcblx0XHRpZiAoISAodGhlbiA9IHV0aWxzLnRoZW5hYmxlKHZhbHVlKSkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdHJlamVjdFByb21pc2UocHJvbWlzZSwgZXJyKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXHRcblx0Ly8gRW5zdXJlIHRoYXQgdGhlIHByb21pc2UgZGlkIG5vdCBhdHRlbXB0IHRvIGZ1bGZpbGwgd2l0aCBpdHNlbGZcblx0aWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG5cdFx0cmVqZWN0UHJvbWlzZShwcm9taXNlLCBuZXcgVHlwZUVycm9yKCdDaXJjdWxhciByZXNvbHV0aW9uIG9mIHByb21pc2VzJykpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0dHJ5IHtcblx0XHQvLyBXYWl0IGZvciB0aGUgdGhlbmFibGUgdG8gZnVsZmlsbC9yZWplY3QgYmVmb3JlIG1vdmluZyBvblxuXHRcdHRoZW4uY2FsbCh2YWx1ZSxcblx0XHRcdGZ1bmN0aW9uKHN1YlZhbHVlKSB7XG5cdFx0XHRcdGlmICghIGRvbmUpIHtcblx0XHRcdFx0XHRkb25lID0gdHJ1ZTtcblxuXHRcdFx0XHRcdC8vIE9uY2UgYWdhaW4gbG9vayBmb3IgY2lyY3VsYXIgcHJvbWlzZSByZXNvbHV0aW9uXG5cdFx0XHRcdFx0aWYgKHZhbHVlID09PSBzdWJWYWx1ZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0UHJvbWlzZShwcm9taXNlLCBuZXcgVHlwZUVycm9yKCdDaXJjdWxhciByZXNvbHV0aW9uIG9mIHByb21pc2VzJykpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJlc29sdmVQcm9taXNlKHByb21pc2UsIHN1YlZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGZ1bmN0aW9uKHN1YlZhbHVlKSB7XG5cdFx0XHRcdGlmICghIGRvbmUpIHtcblx0XHRcdFx0XHRkb25lID0gdHJ1ZTtcblxuXHRcdFx0XHRcdHJlamVjdFByb21pc2UocHJvbWlzZSwgc3ViVmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0KTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0aWYgKCEgZG9uZSkge1xuXHRcdFx0ZG9uZSA9IHRydWU7XG5cblx0XHRcdHJlamVjdFByb21pc2UocHJvbWlzZSwgZXJyKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuLy8gXG4vLyBGdWxmaWxsIHRoZSBnaXZlbiBwcm9taXNlXG4vLyBcbi8vIEBwYXJhbSB7cHJvbWlzZX0gdGhlIHByb21pc2UgdG8gcmVzb2x2ZVxuLy8gQHBhcmFtIHt2YWx1ZX0gdGhlIHZhbHVlIG9mIHRoZSBwcm9taXNlXG4vLyBAcmV0dXJuIHZvaWRcbi8vIFxuZnVuY3Rpb24gZnVsZmlsbFByb21pc2UocHJvbWlzZSwgdmFsdWUpIHtcblx0aWYgKHByb21pc2Uuc3RhdGUgIT09IFBFTkRJTkcpIHtyZXR1cm47fVxuXG5cdHNldFZhbHVlKHByb21pc2UsIHZhbHVlKTtcblx0c2V0U3RhdGUocHJvbWlzZSwgVU5GVUxGSUxMRUQpO1xuXG5cdHNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcblx0XHRzZXRTdGF0ZShwcm9taXNlLCBGVUxGSUxMRUQpO1xuXHRcdGludm9rZUZ1bmN0aW9ucyhwcm9taXNlKTtcblx0fSk7XG59XG5cbi8vIFxuLy8gUmVqZWN0IHRoZSBnaXZlbiBwcm9taXNlXG4vLyBcbi8vIEBwYXJhbSB7cHJvbWlzZX0gdGhlIHByb21pc2UgdG8gcmVqZWN0XG4vLyBAcGFyYW0ge3ZhbHVlfSB0aGUgdmFsdWUgb2YgdGhlIHByb21pc2Vcbi8vIEByZXR1cm4gdm9pZFxuLy8gXG5mdW5jdGlvbiByZWplY3RQcm9taXNlKHByb21pc2UsIHZhbHVlKSB7XG5cdGlmIChwcm9taXNlLnN0YXRlICE9PSBQRU5ESU5HKSB7cmV0dXJuO31cblxuXHRzZXRWYWx1ZShwcm9taXNlLCB2YWx1ZSk7XG5cdHNldFN0YXRlKHByb21pc2UsIFVORlVMRklMTEVEKTtcblxuXHRzZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG5cdFx0c2V0U3RhdGUocHJvbWlzZSwgRkFJTEVEKTtcblx0XHRpbnZva2VGdW5jdGlvbnMocHJvbWlzZSk7XG5cdH0pO1xufVxuXG4vLyBcbi8vIFNldCB0aGUgc3RhdGUgb2YgYSBwcm9taXNlXG4vLyBcbi8vIEBwYXJhbSB7cHJvbWlzZX0gdGhlIHByb21pc2UgdG8gbW9kaWZ5XG4vLyBAcGFyYW0ge3N0YXRlfSB0aGUgbmV3IHN0YXRlXG4vLyBAcmV0dXJuIHZvaWRcbi8vIFxuZnVuY3Rpb24gc2V0U3RhdGUocHJvbWlzZSwgc3RhdGUpIHtcblx0dXRpbHMuZGVmaW5lUHJvcGVydHkocHJvbWlzZSwgJ3N0YXRlJywge1xuXHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdC8vIEFjY29yZGluZyB0byB0aGUgc3BlYzogSWYgdGhlIHN0YXRlIGlzIFVORlVMRklMTEVEICgwKSwgdGhlIHN0YXRlIGNhbiBiZSBjaGFuZ2VkO1xuXHRcdC8vIElmIHRoZSBzdGF0ZSBpcyBGVUxGSUxMRUQgKDEpIG9yIEZBSUxFRCAoMiksIHRoZSBzdGF0ZSBjYW5ub3QgYmUgY2hhbmdlZCwgYW5kIHRoZXJlZm9yZSB3ZVxuXHRcdC8vIGxvY2sgdGhlIHByb3BlcnR5XG5cdFx0Y29uZmlndXJhYmxlOiAoISBzdGF0ZSksXG5cdFx0d3JpdGFibGU6IGZhbHNlLFxuXHRcdHZhbHVlOiBzdGF0ZVxuXHR9KTtcbn1cblxuLy8gXG4vLyBTZXQgdGhlIHZhbHVlIG9mIGEgcHJvbWlzZVxuLy8gXG4vLyBAcGFyYW0ge3Byb21pc2V9IHRoZSBwcm9taXNlIHRvIG1vZGlmeVxuLy8gQHBhcmFtIHt2YWx1ZX0gdGhlIHZhbHVlIHRvIHN0b3JlXG4vLyBAcmV0dXJuIHZvaWRcbi8vIFxuZnVuY3Rpb24gc2V0VmFsdWUocHJvbWlzZSwgdmFsdWUpIHtcblx0dXRpbHMuZGVmaW5lUHJvcGVydHkocHJvbWlzZSwgJ3ZhbHVlJywge1xuXHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG5cdFx0d3JpdGFibGU6IGZhbHNlLFxuXHRcdHZhbHVlOiB2YWx1ZVxuXHR9KTtcbn1cblxuLy8gXG4vLyBJbnZva2UgYWxsIGV4aXN0aW5nIGZ1bmN0aW9ucyBxdWV1ZWQgdXAgb24gdGhlIHByb21pc2Vcbi8vIFxuLy8gQHBhcmFtIHtwcm9taXNlfSB0aGUgcHJvbWlzZSB0byBydW4gZnVuY3Rpb25zIGZvclxuLy8gQHJldHVybiB2b2lkXG4vLyBcbmZ1bmN0aW9uIGludm9rZUZ1bmN0aW9ucyhwcm9taXNlKSB7XG5cdHZhciBmdW5jcyA9IHByb21pc2UuZnVuY3M7XG5cblx0Zm9yICh2YXIgaSA9IDAsIGMgPSBmdW5jcy5sZW5ndGg7IGkgPCBjOyBpICs9IDMpIHtcblx0XHRpbnZva2VGdW5jdGlvbihwcm9taXNlLCBmdW5jc1tpXSwgZnVuY3NbaSArIHByb21pc2Uuc3RhdGVdKTtcblx0fVxuXG5cdC8vIEVtcHR5IG91dCB0aGlzIGxpc3Qgb2YgZnVuY3Rpb25zIGFzIG5vIG9uZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZFxuXHQvLyBtb3JlIHRoYW4gb25jZSwgYW5kIHdlIGRvbid0IHdhbnQgdG8gaG9sZCB0aGVtIGluIG1lbW9yeSBsb25nZXIgdGhhbiBuZWVkZWRcblx0cHJvbWlzZS5mdW5jcy5sZW5ndGggPSAwO1xufVxuXG4vLyBcbi8vIEludm9rZSBvbmUgc3BlY2lmaWMgZnVuY3Rpb24gZm9yIHRoZSBwcm9taXNlXG4vLyBcbi8vIEBwYXJhbSB7cHJvbWlzZX0gdGhlIHByb21pc2UgdGhlIGZ1bmN0aW9uIGJlbG9uZ3MgdG9vICh0aGF0IC50aGVuIHdhcyBjYWxsZWQgb24pXG4vLyBAcGFyYW0ge2NoaWxkfSB0aGUgcHJvbWlzZSByZXR1cm4gZnJvbSB0aGUgLnRoZW4gY2FsbDsgdGhlIG5leHQgaW4gbGluZVxuLy8gQHBhcmFtIHtmdW5jfSB0aGUgZnVuY3Rpb24gdG8gY2FsbFxuLy8gQHJldHVybiB2b2lkXG4vLyBcbmZ1bmN0aW9uIGludm9rZUZ1bmN0aW9uKHByb21pc2UsIGNoaWxkLCBmdW5jKSB7XG5cdHZhciB2YWx1ZSA9IHByb21pc2UudmFsdWU7XG5cdHZhciBzdGF0ZSA9IHByb21pc2Uuc3RhdGU7XG5cblx0Ly8gSWYgd2UgaGF2ZSBhIGZ1bmN0aW9uIHRvIHJ1biwgcnVuIGl0XG5cdGlmICh0eXBlb2YgZnVuYyA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHRyeSB7XG5cdFx0XHR2YWx1ZSA9IGZ1bmModmFsdWUpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0cmVqZWN0UHJvbWlzZShjaGlsZCwgZXJyKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0XG5cdFx0cmVzb2x2ZVByb21pc2UoY2hpbGQsIHZhbHVlKTtcblx0fVxuXG5cdGVsc2UgaWYgKHN0YXRlID09PSBGVUxGSUxMRUQpIHtcblx0XHRyZXNvbHZlUHJvbWlzZShjaGlsZCwgdmFsdWUpO1xuXHR9XG5cblx0ZWxzZSBpZiAoc3RhdGUgPT09IEZBSUxFRCkge1xuXHRcdHJlamVjdFByb21pc2UoY2hpbGQsIHZhbHVlKTtcblx0fVxufVxuIiwiXG52YXIgX2dsb2JhbCA9IChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLmNhbGwoKTtcblxuLy8gXG4vLyBJZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSB2YWxpZCB0aGVuYWJsZSwgcmV0dXJuIHRoZSB0aGVuIG1ldGhvZDsgb3RoZXJ3aXNlLCByZXR1cm4gZmFsc2Vcbi8vIFxuZXhwb3J0cy50aGVuYWJsZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdGlmICh2YWx1ZSAmJiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHZhciB0aGVuID0gdmFsdWUudGhlbjtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdHRocm93IGVycjtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHJldHVybiB0aGVuO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBmYWxzZTtcbn1cblxuLy8gXG4vLyBTaGltIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBpZiBuZWVkZWQ7IFRoaXMgd2lsbCBuZXZlciBydW4gaW4gTm9kZS5qcyBsYW5kLCBidXRcbi8vIGlzIGhlcmUgZm9yIHdoZW4gd2UgYnJvd3NlcmlmeVxuLy8gXG5leHBvcnRzLmRlZmluZVByb3BlcnR5ID0gZnVuY3Rpb24ob2JqLCBwcm9wLCBvcHRzKSB7XG5cdGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIHByb3AsIG9wdHMpO1xuXHRcdH0gY2F0Y2ggKGVycikgeyB9XG5cdH1cblx0XG5cdGlmIChvcHRzLnZhbHVlKSB7XG5cdFx0b2JqW3Byb3BdID0gb3B0cy52YWx1ZTtcblx0fVxufTtcblxuLy8gXG4vLyBzZXRJbW1lZGlhdGUgc2hpbVxuLy8gXG5pZiAoISBfZ2xvYmFsLnNldEltbWVkaWF0ZSkge1xuXHRfZ2xvYmFsLnNldEltbWVkaWF0ZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcblx0XHRzZXRUaW1lb3V0KGZ1bmMsIDApO1xuXHR9O1xufVxuXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKG9iaikge1xuXHRjb25zb2xlLmxvZyhcblx0XHRyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChvYmosIHtcblx0XHRcdGNvbG9yczogdHJ1ZSxcblx0XHRcdHNob3dIaWRkZW46IHRydWUsXG5cdFx0XHRkZXB0aDogMlxuXHRcdH0pXG5cdClcbn07XG4iLCIvKipcbiAqIFJlZGRpdCBBUEkgd3JhcHBlciBmb3IgdGhlIGJyb3dzZXIgKGh0dHBzOi8vZ2l0LmlvL013MzlWUSlcbiAqIEBhdXRob3IgU2FoaWwgTXV0aG9vIDxzYWhpbC5tdXRob29AZ21haWwuY29tPiAoaHR0cHM6Ly93d3cuc2FoaWxtLmNvbSlcbiAqIEBsaWNlbnNlIE1JVFxuICovXG4hZnVuY3Rpb24od2luZG93KXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBsaXN0aW5nKG9uLGV4dHJhcyl7cmV0dXJuIGV4dHJhcz1leHRyYXN8fFtdLHdpdGhGaWx0ZXJzKG9uLFtcImFmdGVyXCIsXCJiZWZvcmVcIixcImNvdW50XCIsXCJsaW1pdFwiLFwic2hvd1wiXS5jb25jYXQoZXh0cmFzKSl9ZnVuY3Rpb24gZmV0Y2gob24pe3JldHVybntmZXRjaDpmdW5jdGlvbihyZXMsZXJyKXtnZXRKU09OKHJlZGRpdFVybChvbikscmVzLGVycil9fX1mdW5jdGlvbiB3aXRoRmlsdGVycyhvbixmaWx0ZXJzKXt2YXIgcmV0PXt9O29uLnBhcmFtcz1vbi5wYXJhbXN8fHt9LGZpbHRlcnM9ZmlsdGVyc3x8W107Zm9yKHZhciB3aXRob3V0PWZ1bmN0aW9uKG9iamVjdCxrZXkpe3ZhciByZXQ9e307Zm9yKHZhciBwcm9wIGluIG9iamVjdClvYmplY3QuaGFzT3duUHJvcGVydHkocHJvcCkmJnByb3AhPT1rZXkmJihyZXRbcHJvcF09b2JqZWN0W3Byb3BdKTtyZXR1cm4gcmV0fSxmaWx0ZXI9ZnVuY3Rpb24oZil7cmV0dXJuXCJzaG93XCI9PT1mP2Z1bmN0aW9uKCl7cmV0dXJuIG9uLnBhcmFtc1tmXT1cImFsbFwiLHdpdGhvdXQodGhpcyxmKX06ZnVuY3Rpb24oYXJnKXtyZXR1cm4gb24ucGFyYW1zW2ZdPWFyZyx3aXRob3V0KHRoaXMsZil9fSxpPTA7aTxmaWx0ZXJzLmxlbmd0aDtpKyspcmV0W2ZpbHRlcnNbaV1dPWZpbHRlcihmaWx0ZXJzW2ldKTtyZXR1cm4gcmV0LmZldGNoPWZ1bmN0aW9uKHJlcyxlcnIpe2dldEpTT04ocmVkZGl0VXJsKG9uKSxyZXMsZXJyKX0scmV0fWZ1bmN0aW9uIHJlZGRpdFVybChvbil7dmFyIHVybD1cImh0dHA6Ly93d3cucmVkZGl0LmNvbS9cIixrZXlzPWZ1bmN0aW9uKG9iamVjdCl7dmFyIHJldD1bXTtmb3IodmFyIHByb3AgaW4gb2JqZWN0KW9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSYmcmV0LnB1c2gocHJvcCk7cmV0dXJuIHJldH07aWYodm9pZCAwIT09b24uc3VicmVkZGl0JiYodXJsKz1cInIvXCIrb24uc3VicmVkZGl0K1wiL1wiKSx1cmwrPW9uLnJlc291cmNlK1wiLmpzb25cIixrZXlzKG9uLnBhcmFtcykubGVuZ3RoPjApe3ZhciBxcz1bXTtmb3IodmFyIHBhcmFtIGluIG9uLnBhcmFtcylvbi5wYXJhbXMuaGFzT3duUHJvcGVydHkocGFyYW0pJiZxcy5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChwYXJhbSkrXCI9XCIrZW5jb2RlVVJJQ29tcG9uZW50KG9uLnBhcmFtc1twYXJhbV0pKTt1cmwrPVwiP1wiK3FzLmpvaW4oXCImXCIpfXJldHVybiB1cmx9ZnVuY3Rpb24gZ2V0SlNPTih1cmwscmVzLGVycil7Z2V0KHVybCxmdW5jdGlvbihkYXRhKXtyZXMoSlNPTi5wYXJzZShkYXRhKSl9LGVycil9ZnVuY3Rpb24gZ2V0KHVybCxyZXMsZXJyKXt2YXIgeGhyPW5ldyBYTUxIdHRwUmVxdWVzdDt4aHIub3BlbihcIkdFVFwiLHVybCwhMCkseGhyLm9ubG9hZD1mdW5jdGlvbigpe3JldHVybiByZXMoeGhyLnJlc3BvbnNlKX0seGhyLm9uZXJyb3I9ZnVuY3Rpb24oKXtyZXR1cm4gdm9pZCAwIT09ZXJyP2Vycih4aHIucmVzcG9uc2UpOnZvaWQgMH0seGhyLnNlbmQoKX12YXIgcmVkZGl0PXdpbmRvdy5yZWRkaXQ9e307cmVkZGl0LmhvdD1mdW5jdGlvbihzdWJyZWRkaXQpe3JldHVybiBsaXN0aW5nKHtzdWJyZWRkaXQ6c3VicmVkZGl0LHJlc291cmNlOlwiaG90XCJ9KX0scmVkZGl0LnRvcD1mdW5jdGlvbihzdWJyZWRkaXQpe3JldHVybiBsaXN0aW5nKHtzdWJyZWRkaXQ6c3VicmVkZGl0LHJlc291cmNlOlwidG9wXCJ9LFtcInRcIl0pfSxyZWRkaXQuY29udHJvdmVyc2lhbD1mdW5jdGlvbihzdWJyZWRkaXQpe3JldHVybiBsaXN0aW5nKHtzdWJyZWRkaXQ6c3VicmVkZGl0LHJlc291cmNlOlwiY29udHJvdmVyc2lhbFwifSxbXCJ0XCJdKX0scmVkZGl0Lm5ldz1mdW5jdGlvbihzdWJyZWRkaXQpe3JldHVybiBsaXN0aW5nKHtzdWJyZWRkaXQ6c3VicmVkZGl0LHJlc291cmNlOlwibmV3XCJ9KX0scmVkZGl0LmFib3V0PWZ1bmN0aW9uKHN1YnJlZGRpdCl7cmV0dXJuIGZldGNoKHtzdWJyZWRkaXQ6c3VicmVkZGl0LHJlc291cmNlOlwiYWJvdXRcIn0pfSxyZWRkaXQucmFuZG9tPWZ1bmN0aW9uKHN1YnJlZGRpdCl7cmV0dXJuIGZldGNoKHtzdWJyZWRkaXQ6c3VicmVkZGl0LHJlc291cmNlOlwicmFuZG9tXCJ9KX0scmVkZGl0LmluZm89ZnVuY3Rpb24oc3VicmVkZGl0KXt2YXIgb249e3N1YnJlZGRpdDpzdWJyZWRkaXQscmVzb3VyY2U6XCJhcGkvaW5mb1wifTtyZXR1cm4gd2l0aEZpbHRlcnMob24sW1wiaWRcIixcImxpbWl0XCIsXCJ1cmxcIl0pfSxyZWRkaXQuY29tbWVudHM9ZnVuY3Rpb24oYXJ0aWNsZSxzdWJyZWRkaXQpe3ZhciBvbj17c3VicmVkZGl0OnN1YnJlZGRpdCxyZXNvdXJjZTpcImNvbW1lbnRzL1wiK2FydGljbGV9O3JldHVybiB3aXRoRmlsdGVycyhvbixbXCJjb21tZW50XCIsXCJjb250ZXh0XCIsXCJkZXB0aFwiLFwibGltaXRcIixcInNvcnRcIl0pfSxyZWRkaXQucmVjb21tZW5kZWRTdWJyZWRkaXRzPWZ1bmN0aW9uKHNybmFtZXMpe3ZhciBvbj17cmVzb3VyY2U6XCJhcGkvcmVjb21tZW5kL3NyL1wiK3NybmFtZXN9O3JldHVybiB3aXRoRmlsdGVycyhvbixbXCJvbWl0XCJdKX0scmVkZGl0LnN1YnJlZGRpdHNCeVRvcGljPWZ1bmN0aW9uKHF1ZXJ5KXt2YXIgb249e3Jlc291cmNlOlwiYXBpL3N1YnJlZGRpdHNfYnlfdG9waWNcIixwYXJhbXM6e3F1ZXJ5OnF1ZXJ5fX07cmV0dXJuIGZldGNoKG9uKX0scmVkZGl0LnNlYXJjaD1mdW5jdGlvbihxdWVyeSxzdWJyZWRkaXQpe3ZhciBvbj17c3VicmVkZGl0OnN1YnJlZGRpdCxyZXNvdXJjZTpcInNlYXJjaFwiLHBhcmFtczp7cTpxdWVyeX19O3JldHVybiB3aXRoRmlsdGVycyhvbixbXCJhZnRlclwiLFwiYmVmb3JlXCIsXCJjb3VudFwiLFwibGltaXRcIixcInJlc3RyaWN0X3NyXCIsXCJzaG93XCIsXCJzb3J0XCIsXCJzeW50YXhcIixcInRcIl0pfSxyZWRkaXQuc2VhcmNoU3VicmVkZGl0cz1mdW5jdGlvbihxdWVyeSl7cmV0dXJuIGxpc3Rpbmcoe3Jlc291cmNlOlwic3VicmVkZGl0cy9zZWFyY2hcIixwYXJhbXM6e3E6cXVlcnl9fSl9LHJlZGRpdC5wb3B1bGFyU3VicmVkZGl0cz1mdW5jdGlvbigpe3JldHVybiBsaXN0aW5nKHtyZXNvdXJjZTpcInN1YnJlZGRpdHMvcG9wdWxhclwifSl9LHJlZGRpdC5uZXdTdWJyZWRkaXRzPWZ1bmN0aW9uKCl7cmV0dXJuIGxpc3Rpbmcoe3Jlc291cmNlOlwic3VicmVkZGl0cy9uZXdcIn0pfSxyZWRkaXQuYWJvdXRVc2VyPWZ1bmN0aW9uKHVzZXJuYW1lKXtyZXR1cm4gZmV0Y2goe3Jlc291cmNlOlwidXNlci9cIit1c2VybmFtZStcIi9hYm91dFwifSl9fSh3aW5kb3cpOyJdfQ==
