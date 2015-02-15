'use strict'; /* global describe, it, before */
var child_process = require('child_process');
var events = require('events');
var path = require('path');
var gutil = require('gulp-util');
var makeStub = require('mocha-make-stub');
require('should');
var forever = require('..');

describe('gulp-forever', function() {
  before(function() {
    this.gulpfilePath = path.join(__dirname, '../example/gulpfile.js');
  });

  before(function() {
    this.stubEvents = new events.EventEmitter();
  });

  describe('forever(gulpfilePath[, options])', function() {
    makeStub(child_process, 'spawn', function(cmd, args/*, opts*/) {
      cmd.should.equal('../node_modules/.bin/gulp');
      args.should.eql(['task1', 'task2']);
      return {};
    });

    makeStub(gutil, 'log', function(msg) {
      if(/Child gulp process running at/.test(msg)) {
        // Emit the ready event when it's logged that the child process is up.
        this.stubEvents.emit('ready');
      }
    }, true);

    it('returns a gulp task specification, without throwing', function() {
      var fn = forever(this.gulpfilePath, ['all']);
      fn.should.be.instanceof(Function);
    });

    it('its generated function runs the desired task on a child process', function(done) {
      this.spawn.called.should.not.equal(true, 'Spawn was already called?');
      var fn = forever(this.gulpfilePath, ['task1', 'task2']);
      fn();

      var _this = this;
      this.stubEvents.on('ready', function() {
        _this.spawn.called
          .should.equal(true, 'Spawn is called by the generated function');
        done();
      });
    });
  });
});
