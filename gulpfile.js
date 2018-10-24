const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

gulp.task('compile', () => {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest('dist/'))
})

gulp.task('copy', () => {
    gulp.src([
            './ts/config/config.json',
        ])
        .pipe(gulp.dest('./dist/config'))
})

gulp.task('build', ['compile', 'copy'])
