/*!
 * gulp
 * $ npm install gulp-sass gulp-autoprefixer gulp-minify-css gulp-jshint gulp-concat gulp-uglify gulp-imagemin gulp-notify gulp-rename gulp-livereload gulp-cache --save-dev
 */
// Load plugins
var gulp = require('gulp'),
    less = require('gulp-less'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-clean-css'),
    // jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    babel=require('gulp-babel'),
    imagemin = require('gulp-imagemin'),
    htmlmin=require('gulp-htmlmin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    // notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    connect = require('gulp-connect'),
    sourcemaps = require('gulp-sourcemaps');


// Styles
gulp.task('styles', function() {
    return gulp.src('css/*.css')
    // .pipe(sass())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('stylesheets'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('assets/css'))
    .pipe(livereload())
});

gulp.task('less', function() {
    return gulp.src('css/*.less')
    .pipe(less())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('stylesheets'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('assets/css'))
    .pipe(livereload())
});


// Scripts
gulp.task('scripts', function() {
  return gulp.src('js/*.js')
    // .pipe(sourcemaps.init())
    // .pipe(jshint())
    // .pipe(jshint.reporter('default'))
    .pipe(babel({presets:['es2015']}))
    // .pipe(concat('public.js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    // .pipe(sourcemaps.write())
    .pipe(gulp.dest('assets/js'))
    .pipe(livereload())

});


// Images
gulp.task('images', function() {
  return gulp.src('images/*')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest('assets/images'))
    .pipe(livereload())

});

gulp.task('html',function(){
    return gulp.src('./','*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('assets'))
});


// Default task
gulp.task('default', function() {
    gulp.start('styles', 'scripts', 'images','less');
});


// Watch
gulp.task('watch', function() {
  // Watch .css files
  gulp.watch('css/*.css', ['styles']);

  // Watch .js files
  gulp.watch('js/*.js', ['scripts']);

  // Watch image files
  gulp.watch('images/*', ['images']);

  gulp.watch('css/*.less',['less']);

  // Create LiveReload server
  livereload.listen();
  connect.server(
      {
        // root:'develop',//从哪个目录开启server
        port:6080,//将服务开启在哪个端口
      }
    );
  // Watch any files in assets/, reload on change
  // gulp.watch(['assets/*']).on('change', livereload.changed);
});