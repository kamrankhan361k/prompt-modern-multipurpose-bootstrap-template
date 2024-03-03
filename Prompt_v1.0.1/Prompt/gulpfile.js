"use strict";

var gulp = require("gulp"),
    newer = require("gulp-newer"),
    del = require('del'),
    imagemin = require("gulp-imagemin"),
    sass = require("gulp-sass"),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require("gulp-autoprefixer"),
    cleanCSS = require("gulp-clean-css"),
    uglify = require("gulp-uglify"),
    npmdist = require('gulp-npm-dist'),
    browsersync = require("browser-sync"),
    fileinclude = require('gulp-file-include'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat');

// paths
var folder = {
    base: "./",
    src: "src/", // source files
    dist: "dist/", // build files
    src_assets: "src/assets/",
    dist_assets: "dist/assets/" //build assets files
};


// copy third party optional libs
function copyLibs() {
    return gulp
        .src(npmdist(), { base: './node_modules' })
        .pipe(rename(function (path) {
            path.dirname = path.dirname.replace(/\/dist/, '').replace(/\\dist/, '');
        }))
        .pipe(gulp.dest(folder.dist_assets + "/libs/"));
}

// clean the dist folder
function clean(done) {
    del.sync(folder.dist);
    done()
}

// image processing
function imageMin() {
    var out = folder.dist_assets + "images";
    return gulp
        .src(folder.src_assets + "images/**/*")
        .pipe(newer(out))
        .pipe(imagemin())
        .pipe(gulp.dest(out));
}

// copy fonts from src folder to dist folder
function fonts() {
    var out = folder.dist_assets + "fonts/";
    return gulp.src([folder.src_assets + "fonts/**/*"]).pipe(gulp.dest(out));
}

// copy html files from src folder to dist folder, also copy favicons
function html() {
    var out = folder.dist;

    return gulp
        .src([folder.src + "**/*.html", "!" + folder.src + "partials/**"])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file',
            indent: true
        }))
        .pipe(gulp.dest(out));
}


// compile sass
function scss() {
    return gulp
        .src([folder.src_assets + "scss/*.scss"])
        .pipe(sourcemaps.init())
        .pipe(sass()) // scss to css
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['> 1%']
            })
        )
        .pipe(gulp.dest(folder.dist_assets + "css/"))
        .pipe(cleanCSS())
        .pipe(
            rename({
                // rename app.css to icons.min.css
                suffix: ".min"
            })
        )
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(folder.dist_assets + "css/"))
        .pipe(browsersync.stream());
}

/**
 * Third party css
 */
function cssVendor() {
    var out = folder.dist_assets + "css/";
    return gulp.src([
        folder.dist_assets + "libs/magnific-popup/magnific-popup.css",
        folder.dist_assets + "libs/bootstrap-select/css/bootstrap-select.min.css",
        folder.dist_assets + "libs/swiper/swiper-bundle.min.css",
        folder.dist_assets + "libs/leaflet/leaflet.css",
        folder.dist_assets + "libs/aos/aos.css"
    ])
        .pipe(concat("vendor.css"))
        .pipe(gulp.dest(out))
        .pipe(cleanCSS())
        .pipe(
            rename({
                // rename app.js to app.min.js
                suffix: ".min"
            })
        )
        .pipe(gulp.dest(out))
}

function jsVendor() {
    var out = folder.dist_assets + "js/";

    // It's important to keep files at this order
    return gulp.src([
        folder.dist_assets + "libs/jquery/jquery.min.js",
        folder.dist_assets + "libs/bootstrap/js/bootstrap.bundle.min.js",
        folder.dist_assets + "libs/feather-icons/feather.min.js",
        folder.dist_assets + "libs/sticky-js/sticky.min.js",
        folder.dist_assets + "libs/magnific-popup/jquery.magnific-popup.min.js",
        folder.dist_assets + "libs/bootstrap-select/js/bootstrap-select.min.js",
        folder.dist_assets + "libs/swiper/swiper-bundle.min.js",
        folder.dist_assets + "libs/leaflet/leaflet.js",
        folder.dist_assets + "libs/jarallax/jarallax.min.js",
        folder.dist_assets + "libs/jarallax/jarallax-element.min.js",
        folder.dist_assets + "libs/jarallax/jarallax-video.min.js",
        folder.dist_assets + "libs/aos/aos.js",
        folder.dist_assets + "libs/countup.js/countUp.umd.js",
        folder.dist_assets + "libs/typed.js/lib/typed.min.js"
    ])
        .pipe(sourcemaps.init())
        .pipe(concat("vendor.js"))
        .pipe(gulp.dest(out))
        .pipe(
            rename({
                // rename app.js to app.min.js
                suffix: ".min"
            })
        )
        // .pipe(uglify())
        .on("error", function (err) {
            console.log(err.toString());
        })
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(out));
}

/**
 * Theme related js
 */
function jsTheme() {
    var out = folder.dist_assets + "js/";

    return gulp
        .src([
            folder.src + "assets/js/**/*.js"
        ])
        .pipe(gulp.dest(out))
        .pipe(
            rename({
                // rename app.js to app.min.js
                suffix: ".min"
            })
        )
        // .pipe(uglify())
        .on("error", function (err) {
            console.log(err.toString());
        })
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(out));
}


// live browser loading
function browserSync(done) {
    browsersync.init({
        server: {
            baseDir: [folder.dist, folder.src, './'],
            middleware: [
                function (req, res, next) {
                    req.method = 'GET';
                    next();
                }
            ]
        }
    });
    done();
}

function reloadBrowserSync(done) {
    browsersync.reload();
    done();
}

function watchFiles() {
    gulp.watch(folder.src + "**/*.html", gulp.series(html, reloadBrowserSync));
    gulp.watch(folder.src_assets + "images/**/*", gulp.series(imageMin, reloadBrowserSync));
    gulp.watch(folder.src_assets + "fonts/**/*", gulp.series(fonts, reloadBrowserSync));
    gulp.watch(folder.src_assets + "scss/**/*", gulp.series(scss, reloadBrowserSync));
    gulp.watch(folder.src_assets + "js/**/*", gulp.series(jsTheme, reloadBrowserSync));
}

// watch all changes
gulp.task("watch", gulp.parallel(watchFiles, browserSync));

// default task
gulp.task(
    "default",
    gulp.series(
        copyLibs,
        imageMin,
        fonts,
        scss,
        cssVendor,
        jsVendor,
        jsTheme,
        html,
        'watch'
    ),
    function (done) { done(); }
);

// build
gulp.task(
    "build",
    gulp.series(
        clean,
        copyLibs,
        imageMin,
        fonts,
        cssVendor,
        scss,
        jsVendor,
        jsTheme,
        html)
);