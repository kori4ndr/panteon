'use strict';

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var del = require('del');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var csso = require('gulp-csso');
var rename = require('gulp-rename');
var posthtml = require('gulp-posthtml');
var include = require('posthtml-include');
var imagemin = require('gulp-imagemin');
var svgstore = require('gulp-svgstore');
var browserSync = require('browser-sync').create();


gulp.task('copy', function () {
  return gulp.src([
      'src/fonts/*.woff2',
      'src/img/**',
      'src/js/**',
      'src/*.html'
    ], {
      base: 'src'
    })
    .pipe(gulp.dest('build'));
});

gulp.task('clean', function () {
  return del('build');
});

gulp.task("html", function () {
  return gulp.src("src/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(gulp.dest("build"))
    .pipe(browserSync.stream());
});

gulp.task('css', function () {
  return gulp.src('src/sass/style.scss')
  .pipe(plumber())
  .pipe(sass({
    includePaths: require('node-normalize-scss').includePaths
  }))
  .pipe(postcss([
    autoprefixer()
  ]))
  .pipe(gulp.dest('build/css'))
  .pipe(csso())
  .pipe(rename('style.min.css'))
  .pipe(gulp.dest('build/css'))
  .pipe(browserSync.stream());
});

gulp.task('images:dev', () =>
  gulp.src('src/img/**/*.{png,jpg,gif,svg}')
  .pipe(gulp.dest('build/img'))
);

gulp.task('images:build', () =>
  gulp.src('src/img/**/*.{png,jpg,gif,svg}')
        .pipe(imagemin([
          imagemin.gifsicle({interlaced: true}),
          imagemin.jpegtran({progressive: true}),
          imagemin.optipng({optimizationLevel: 5}),
          imagemin.svgo({
              plugins: [
                  {removeViewBox: true},
                  {cleanupIDs: false}
              ]
          })
      ]))
  .pipe(gulp.dest('build/img'))
);

gulp.task('svgstore', function () {
  return gulp
      .src('src/img/icon-*.svg')
      .pipe(svgstore({
        inlineSvg: true
      }))
      .pipe(rename("sprite.svg"))
      .pipe(gulp.dest('build/img'));
});

gulp.task('clean-svg', function () {
  return del('build/img/*icon-*.svg');
});

gulp.task('serve', function() {
  browserSync.init({
      server: {
          baseDir: "build"
      }
  });
  browserSync.watch('build', browserSync.stream)
});


gulp.task('watch', function () {
  gulp.watch('src/*.html', gulp.series('html'));
  gulp.watch('src/sass/**/*.scss', gulp.series('css'))
  gulp.watch('src/img/*', gulp.series('images:dev'))
  gulp.watch('src/img/icon-*.svg', gulp.series('svgstore'))
});

gulp.task('default', gulp.series(
  gulp.series('clean', 'copy', 'images:dev', 'svgstore', 'clean-svg', 'html', 'css'),
  gulp.parallel('watch', 'serve')
));

gulp.task('build', gulp.series(
  gulp.series('clean', 'copy', 'svgstore','images:build', 'clean-svg', 'html', 'css')
));
