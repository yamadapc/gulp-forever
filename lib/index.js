'use strict';
var child_process = require('child_process');
var gulp = require('gulp');
var gutil = require('gulp-util');
var mdeps = require('module-deps');

exports = module.exports = gulpForever;

/**
 * Gulp forever takes an array of task names to run on the child and an options
 * object.
 *
 * @param {String} gulpfilePath The path to your gulpfile
 * @param {Array.<String>} tasks An array of tasks for the slave process to
 * run. This will be passed directly as the parameters to the child
 */

function gulpForever(gulpfilePath, tasks) {
  return function() {
    var child;

    function restart() {
      if(child) {
        gutil.log('Killing child process ' + child.pid);
        child.kill();
      }

      gutil.log('Starting child gulp process');
      child = child_process.spawn('../node_modules/.bin/gulp', tasks, {
        stdio: 'inherit',
      });

      gutil.log('Child gulp process running at PID ' + child.pid);
    }

    getDependencies(gulpfilePath, function(err, paths) {
      if(err) {
        err.message = 'Failed to get gulpfile\'s dependencies:\n' + err.message;
        throw err;
      }

      gulp.watch(paths, function(fp) {
        gutil.log('Gulp configuration dependency ' + fp + ' changed');
        restart();
      });
      restart();
    });
  };
}

// A hash of all core modules, which we need to ignore with `module-deps`.
var CORE_MODULES = [
  "assert", "buffer_ieee754", "buffer", "child_process", "cluster", "console",
  "constants", "crypto", "_debugger", "dgram", "dns", "domain", "events",
  "freelist", "fs", "http", "https", "_linklist", "module", "net", "os",
  "path", "punycode", "querystring", "readline", "repl", "stream",
  "string_decoder", "sys", "timers", "tls", "tty", "url", "util", "vm", "zlib"
].reduce(function(m, mod) {
  m[mod] = true;
  return m;
}, {});

/**
 * Uses `module-deps` to find all file dependencies for a given file. Yields an
 * error or an array of file paths.
 *
 * @param {String} targetPath
 * @param {Function.<Error, Array>} cb
 */

function getDependencies(gulpfilePath, cb) {
  cb = once(cb);
  var md = mdeps({
    filter: function(id) {
      if(CORE_MODULES[id]) {
        return false;
      }
      return true;
    },
  });

  var deps = [];

  md.on('error', cb);
  md.on('data', function(ds) {
    deps.push(ds.file);
  });

  md.on('end', function() {
    cb(null, deps);
  });

  md.end(gulpfilePath);
}

/**
 * Wraps a function so that it'll only be called once.
 *
 * @param {Function} fn
 * @return {Function} wrapped$fn
 */
function once(fn) {
  var called = false;
  return function once$wrapper() {
    if(called) return;
    called = true;
    return fn.apply(this, arguments);
  };
}
