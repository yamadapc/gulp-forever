'use strict';
var gulp = require('gulp');
var gulpForever = require('..'); // require('gulp-forever');

gulp.task('default', gulpForever(__filename, ['all']));
gulp.task('all', function() {
  gulp.watch('./test.js', function() {
    console.log('test changed and I\'m working now');
  });
});
