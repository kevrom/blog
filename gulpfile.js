'use strict';

var path         = require('path');
var gulp         = require('gulp');
var transform    = require('vinyl-transform');
var browserify   = require('browserify');
var riot_compile = require('riot/compiler');
var merge        = require('merge-stream');
var imagemin     = require('gulp-imagemin');
var jshint       = require('gulp-jshint');
var uglify       = require('gulp-uglify');
var sass         = require('gulp-ruby-sass');
var minifyCss    = require('gulp-minify-css');
var sourcemaps   = require('gulp-sourcemaps');
var del          = require('del');
var runSequence  = require('run-sequence');

// Gulp paths
var SRC_DIR = './public';
var BUILD_DIR = './dist';

var SRC_JS = path.join(SRC_DIR, 'js');
var SRC_TAGS = path.join(SRC_DIR, 'tags');
var SRC_SASS = path.join(SRC_DIR, 'sass');
var SRC_IMG = path.join(SRC_DIR, 'img');
var SRC_FONTS = path.join(SRC_DIR, 'fonts');

var SASS_OPTIONS = {
	loadPath: [
		SRC_SASS,
		path.join(SRC_DIR, 'lib')
	],
	sourcemapPath: path.join(BUILD_DIR, 'maps'),
	quiet: true
};

var BROWSERIFY_ENTRY_POINTS = [
	path.join(SRC_JS, 'main.js')
];

// Clean up build directory
gulp.task('clean', function(cb) {
	del(BUILD_DIR, function(err) {
		if (err) { cb(err); }
		cb();
	});
});


// SASS compilation
gulp.task('styles', function() {
	return gulp.src(SRC_SASS + '/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass(SASS_OPTIONS))
		.pipe(minifyCss())
		.pipe(gulp.dest(path.join(BUILD_DIR, 'css')));
});


// Javscript linting
gulp.task('lint', function() {
	return gulp.src(SRC_JS)
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));
});


// Javascript assets pipeline
gulp.task('scripts', function() {
	var browserified = transform(function(file) {
		return browserify(file).bundle();
	});
	return gulp.src(BROWSERIFY_ENTRY_POINTS)
		.pipe(sourcemaps.init())
		.pipe(browserified)
		.pipe(uglify())
		.pipe(sourcemaps.write('../maps'))
		.pipe(gulp.dest(path.join(BUILD_DIR, 'js')));
});

// Riot.js tags
gulp.task('tags', function() {
	var compiled = transform(function(file) {
		return riot_compile(file, { compact: true });
	});
	return gulp.src(SRC_TAGS+'/*')
		.pipe(compiled)
		//.pipe(uglify())
		.pipe(gulp.dest(path.join(BUILD_DIR, 'tags')));
});

// Images
gulp.task('images', function() {
	return gulp.src(SRC_IMG)
		.pipe(imagemin())
		.pipe(gulp.dest(path.join(BUILD_DIR, 'img')));
});


// Fonts
gulp.task('fonts', function() {
	return gulp.src(SRC_FONTS)
		.pipe(gulp.dest(path.join(BUILD_DIR, 'fonts')));
});


// Vendor scripts and assets
gulp.task('vendor', function() {
	var FONT_AWESOME_SASS,
		FONT_AWESOME_FONTS,
		JQUERY;

	FONT_AWESOME_SASS = gulp.src(path.join(SRC_DIR, 'lib', 'font-awesome.scss'))
		.pipe(sourcemaps.init())
		.pipe(sass(SASS_OPTIONS))
		.pipe(minifyCss())
		.pipe(gulp.dest(path.join(BUILD_DIR, 'vendor', 'font-awesome')));

	FONT_AWESOME_FONTS = gulp.src('./node_modules/font-awesome/fonts/*')
		.pipe(gulp.dest(path.join(BUILD_DIR, 'vendor', 'font-awesome')));

	JQUERY = gulp.src('./node_modules/jquery/dist/jquery.js')
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(sourcemaps.write('../../maps'))
		.pipe(gulp.dest(path.join(BUILD_DIR, 'vendor', 'jquery')));

	return merge(
		FONT_AWESOME_SASS,
		FONT_AWESOME_FONTS,
		JQUERY
	);
});



// Watch function
gulp.task('watch', function() {
	gulp.watch(SRC_SASS+'/*', ['styles']);
	gulp.watch(SRC_JS+'/*', ['lint', 'scripts']);
	gulp.watch(SRC_IMG+'/*', ['images']);
});

gulp.task('build', function(cb) {
	runSequence(
		// clean build directory
		'clean',

		// run these in parallel
		[
			'lint',
			'scripts',
			'styles',
			'images',
			'vendor'
		],
		function(err) {
			if (err) { cb(err); }
			cb();
		}
	);
});

gulp.task('default', ['build', 'watch']);
