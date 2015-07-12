'use strict'; 'use strong';

// Global Modules
import fs from                      'fs';
import {transform} from             'babel';

// System Modules
import {exec} from                  'child_process';
import util from                    'util';
import {gray} from                  'chalk';
import {$injectionBinder} from      'angie-injector';
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
    } else if (v === 'help') {
        help();
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
                this.$$registry[ name ] = 'Models';
                this.Models[ name ] = obj;
            } else {
                $LogProvider.warn('Invalid name or object called on app.$register');
            }
            return this;
        },
        $$load() {
            return new Promise(function(resolve) {
                let files = [];

                // Find ALL the files
                try {

                    files = files.concat(fs.readdirSync(
                        `${p.cwd()}/src`
                    ).map((v) => `${p.cwd()}/src/${v}`));
                } catch(e) {}
                try {
                    files = files.concat(fs.readdirSync(
                        `${p.cwd()}/src/Models`
                    ).map((v) => `${p.cwd()}/src/Models/${v}`));
                } catch(e) {}
                try {
                    files = files.concat(fs.readdirSync(
                        `${p.cwd()}/src/models`
                    ).map((v) => `${p.cwd()}/src/models/${v}`));
                } catch(e) {}

                // Make sure the files are js/es6 files, then try to load them
                files.filter(
                    (v) => [ 'js', 'es6' ].indexOf(v.split('.').pop()) > -1
                ).forEach(function(v) {
                    console.log(v);
                    try {
                        require(v);
                        $LogProvider.info(`Successfully loaded file ${v}`);
                    } catch(e) {
                        $LogProvider.error(e);
                    }
                });
                console.log('calling resolve');
                resolve();
            });
        }
    };
    app.$Fields = $$FieldProvider;
    app.services.$Log = $LogProvider;
    app.$$registry.$Log = 'services';
}

app.services.$Fields = $$FieldProvider;
app.$$registry.$Fields = 'services';
app.Models = {};

/**
 * @desc Creates an Angie ORM Model provider. The second parameter
 * of the Model function must be an object or a function/class which returns an
 * object, with properties defining the Model itself (name, fields, etc). Note
 * that the first bound paramter to the second argument will always be $Fields
 * if the second argument is a function.
 * @since 0.0.1
 * @access public
 * @param {string} name The name of the constant being created
 * @param {function|object} obj The Model value, returns Models params.
 */
app.Model = function Model(name, obj = {}) {
    const model = typeof obj === 'function' ?
        new $injectionBinder(obj.bind(null, $$FieldProvider))() :
            typeof obj === 'object' ? obj : undefined;

    name = typeof name === 'string' ? name : model.name;

    let instance = new BaseModel(name);

    // Mock extend obj onto the instance
    if (typeof model === 'object') {
        console.log(instance, model);
        instance = util._extend(instance, model);
    } else {
        throw new $$InvalidModelConfigError(name);
    }
    return this.$$register('Models', name, instance);
};

// Route the CLI request to a specific command if running from CLI
if (
    args.length &&
    args.some((v) => [ 'syncdb', 'migrate', 'test' ].indexOf(v) > -1)
) {
    switch ((args[0] || '').toLowerCase()) {
        case 'syncdb':
            AngieDatabaseRouter().sync();
            break;
        case 'migrate':
            AngieDatabaseRouter().migrate();
            break;
        default:
            runTests();
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