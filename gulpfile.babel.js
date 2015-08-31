import {default as register} from   'babel-core/register';
register({
    only: [
        '**/node_modules/angie*/**',
        '**/src/**',
        '**/test/**'
    ],
    stage: 0
});

// System Modules
import fs from              'fs';
import gulp from            'gulp';
import {argv} from          'yargs';
import {exec} from          'child_process';
import eslint from          'gulp-eslint';
import jscs from            'gulp-jscs';
import {Instrumenter} from  'isparta';
import mocha from           'gulp-mocha';
import istanbul from        'gulp-istanbul';
import cobertura from       'istanbul-cobertura-badger';
import esdoc from           'gulp-esdoc';
import babel from           'gulp-babel';
import {bold, red} from     'chalk';

const bread = (str) => bold(red(str));

const SRC_DIR = 'src',
    SRC = `${SRC}/**/*.js`,
    TRANSPILED_SRC = 'dist',
    TEST_SRC = 'test/**/*.spec.js',
    DOC_SRC = 'doc',
    COVERAGE_SRC = 'coverage';

gulp.task('eslint', function () {
    gulp.src([ SRC, TEST_SRC ]).pipe(
        eslint()
    ).pipe(
        eslint.format()
    ).pipe(
        eslint.failOnError()
    );
});
gulp.task('jscs', [ 'eslint' ], function () {
    return gulp.src([ SRC, TEST_SRC ])
        .pipe(jscs({
            fix: true,
            configPath: '.jscsrc',
            esnext: true
        }));
});
gulp.task('istanbul', function(cb) {
    gulp.src('src/**/*.js').pipe(istanbul({
        instrumenter: Instrumenter,
        includeUntested: true,
        babel: {
            stage: 0
        }
    })).pipe(istanbul.hookRequire()).on('finish', cb);
});
gulp.task('mocha', [ 'istanbul' ], function(cb) {
    gulp.src([
        'test/src/testUtil.spec.js',
        'test/**/*.spec.js'
    ]).pipe(mocha({
        reporter: 'spec'
    })).pipe(istanbul.writeReports({
        dir: 'coverage',
        reportOpts: {
            dir: 'coverage'
        },
        reporters: [ 'text', 'text-summary', 'html', 'cobertura' ]
    }).on('finish', function() {
        return cobertura('coverage/cobertura-coverage.xml', 'svg', cb);
    }));
});
gulp.task('babel', function() {
    return gulp.src('src/**').pipe(babel({
        comments: false
    })).pipe(gulp.dest('dist'));
});
gulp.task('esdoc', function() {
    return gulp.src(SRC_DIR).pipe(esdoc({ destination: DOC_SRC }));
});
gulp.task('bump', function() {
    const version = argv.version,
        bump = (f) => fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(
            /[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}/,
            version
        ));
    if (version) {

        // Verify that the version is in the CHANGELOG
        if (fs.readFileSync('CHANGELOG.md', 'utf8').indexOf(version) === -1) {
            throw new Error(bread('Version has no entry in CHANGELOG.md'));
        }

        bump('bin/angie-orm');
        bump('bin/angie-orm-dist');
        bump('package.json');
    } else {
        throw new Error(bold(red('No version specified!!')));
    }
});
gulp.task('watch', [ 'jscs', 'mocha' ], function() {
    gulp.watch([ SRC, TEST_SRC ], [ 'mocha' ]);
});
gulp.task('test', [ 'jscs', 'mocha' ]);
gulp.task('default', [ 'jscs', 'mocha', 'babel', 'esdoc' ]);