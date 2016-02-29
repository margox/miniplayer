var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var htmlmin = require('gulp-htmlmin');

gulp.task('clean', function() {
    return gulp.src('dist', {read: false})
        .pipe(clean());

});

gulp.task('buildscss', function() {
    return gulp.src('src/view/scss/**/*.scss')
        .pipe(sass({ outputStyle: 'compressed' }))
        .pipe(gulp.dest('dist/view/assets/css'));

});

gulp.task('uglifyjs', function() {
    return gulp.src('src/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist'));

});

gulp.task('uglifyhtml', function() {
    return gulp.src('src/**/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('dist'));
});

gulp.task('movefiles', function() {
    return gulp.src([
            'src/package.json',
            'src/view*/assets*/images*/*',
            'src/view*/assets*/fonts*/*'
        ])
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['clean'], function() {
    gulp.start('buildscss', 'uglifyjs', 'uglifyhtml', 'movefiles');
});