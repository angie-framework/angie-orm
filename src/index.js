'use strict'; 'use strong';

// Global Modules
import fs from                      'fs';
import {transform} from             'babel';

// System Modules
import {exec} from                  'child_process';
import util from                    'util';
import {gray} from                  'chalk';
import $LogProvider from            'angie-log';

// Angie ORM Modules
import {BaseModel} from             './models/BaseModel';
import AngieDatabaseRouter from     './models/AngieDatabaseRouter';
import * as $$FieldProvider from    './models/Fields';
import {
    $$InvalidModelConfigError
} from                              './util/$ExceptionsProvider';

// Tranform BabelJS options
transform('code', { stage: 0 });

const p = process;
let args = [];

// Remove trivial arguments
p.argv.forEach(function(v) {
    if (!v.match(/(node|iojs|index|angie(-orm)?)/)) {
        args.push(v);
    }
});

// Setup the app or inherit the app from the `global` Namespace
let app;
if (global.app) {
    app = global.app;
} else {
    app = global.app = {
        services: {},
        $$registry: {},
        $$register(c, name, obj) {

            // `component` and `app.component` should always be defined
            if (name && obj) {
                this.$registry[ name ] = 'Models';
                this.Models[ name ] = obj;
            } else {
                console.warn('Invalid name or object called on app.$register');
            }
            return this;
        },
        $$load() {
            let files = [];

            // Find ALL the files
            try {
                files.concat(fs.readdirSync(`${p.cwd()}/src`).map((v) => {
                    return `${p.cwd()}/src/${v}`
                }));
            } catch(e) {}
            try {
                files.concat(fs.readdirSync(`${p.cwd()}/src/Models`).map((v) => {
                    return `${p.cwd()}/src/Models/${v}`
                }));
            } catch(e) {}
            try {
                files.concat(fs.readdirSync(`${p.cwd()}/src/models`).map((v) => {
                    return `${p.cwd()}/src/models/${v}`
                }));
            } catch(e) {}

            // Make sure the files are js/es6 files, then try to load them
            files.filter(
                (v) => [ 'js', 'es6' ].indexOf(v.split('.').pop())
            ).forEach(function(v) {
                try {
                    require(v);
                    $LogProvider.info(`Successfully loaded file ${v}`);
                } catch(e) {
                    $LogProvider.error(e);
                }
            });
        }
    };
    app.$Fields = $$FieldProvider;
}

app.services.$Fields = $$FieldProvider;
app.$$registry.$Fields = 'services';
app.Models = {};
app.Model = function Model(name, obj = {}) {
    const model = new $injectionBinder(obj)();
    name = typeof name === 'string' ? name : model.name;

    let instance = new BaseModel(name);

    // Mock extend obj onto the instance
    if (typeof model === 'object') {
        instance = util.inherits(instance, model);
    } else {
        throw new $$InvalidModelConfigError(name);
    }
    return this.$register('Models', name, instance);
};

console.log(global.app);

// Route the CLI request to a specific command if running from CLI
if (
    args.length &&
    args.some((v) => [ 'help', 'syncdb', 'migrate', 'test' ].indexOf(v) > -1)
) {
    switch ((args[0] || '').toLowerCase()) {
        case 'help':
            help();
            break;
        case 'syncdb':
            AngieDatabaseRouter().sync();
            break;
        case 'migrate':
            AngieDatabaseRouter().migrate();
            break;
        case 'test':
            runTests();
            break;
        default:
            help();
    }
    p.exit(0);
}

function runTests() {

    // TODO is there any way to carry the stream output from gulp instead
    // of capturing stdout?
    exec(`cd ${__dirname} && gulp`, function(e, std, err) {
        $LogProvider.info(std);
        if (err) {
            $LogProvider.error(err);
        }
        if (e) {
            throw new Error(e);
        }
    });
}

function help() {
    $LogProvider.bold('Angie ORM');
    console.log('A flexible, Promise-based ORM for the Angie MVC');
    console.log('\r');
    $LogProvider.bold('Version:');
    console.log(global.ANGIE_ORM_VERSION);
    console.log('\r');
    $LogProvider.bold('Commands:');
    console.log(
        'syncdb [ database ]                                ' +
        gray(
            'Sync the current specified databases in the AngieFile. ' +
            'Defaults to the default created database'
        )
    );
    console.log(
        'migrations [ --destructive -- optional ]           ' +
        gray(
            'Checks to see if the database and the specified ' +
            'models are out of sync. Generates NO files.'
        )
    );
    console.log(
        'test                                               ' +
        gray(
            'Runs the Angie test suite and prints the results in the ' +
            'console'
        )
    );
    p.exit(0);
}

// TODO do we even need this?
// console.log($$FieldProvider);
// export {$$FieldProvider as $Fields};