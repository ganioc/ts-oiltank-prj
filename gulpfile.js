const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

gulp.task('compile', () => {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest('dist/'))
})

// gulp.task('copy', () => {
//     gulp.src([
//             './ts/config/defaultconfig.json',
//             './ts/config/newnode1.json',
//             './ts/config/newnode2.json',
//             './ts/config/newnode3.json',
//         ])
//         .pipe(gulp.dest('./dist/config'))
// })

gulp.task('build', ['compile'])
