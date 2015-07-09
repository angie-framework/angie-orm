'use strict'; 'use strong';

// Global Modules
import {transform} from             'babel';

// System Modules
import {exec} from                  'child_process';
import util from                    'util';

// Angie-ORM Modules
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
    if (!v.match(/(node|iojs|index|angie-orm)/)) {
        args.push(v);
    }
});

// Grab the instantiated Angie app, or use an empty object. We can still
// use this to sync database
let app = global.app || {
    _registry: {},
    _register: function _register(c, name, obj) {

        // `component` and `app.component` should always be defined
        if (name && obj) {
            this._registry[ name ] = 'Models';
            this.Models[ name ] = obj;
        } else {
            console.warn('Invalid name or object called on app._register');
        }
        return this;
    }
};

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
    return this._register('Models', name, instance);
};

app.service('$fields', $$FieldProvider);

// Route the CLI request to a specific command if running from CLI
if (!module.parent) {
    switch ((args[0] || '').toLowerCase()) {
        case 'syncdb':
            AngieDatabaseRouter().then((db) => db.sync());
            break;
        case 'migrate':
            AngieDatabaseRouter().then((db) => db.migrate());
            break;
        case 'test':
            runTests();
            break;
        default:
            help();
    }
}

function runTests() {

    // TODO is there any way to carry the stream output from gulp instead
    // of capturing stdout?
    exec(`cd ${__dirname} && gulp`, function(e, std, err) {
        $log.log(std);
        if (err) {
            $log.error(err);
        }
        if (e) {
            throw new Error(e);
        }
    });
}

function help() {
    console.log(chalk.bold('Angie ORM'));
    console.log('A flexible, Promise-based ORM for the Angie MVC');
    console.log('\r');
    console.log(chalk.bold('Version:'));
    console.log(global.ANGIE_ORM_VERSION);
    console.log('\r');
    console.log(chalk.bold('Commands:'));
    console.log(
        'syncdb [ database ]                                ' +
        chalk.gray(
            'Sync the current specified databases in the AngieFile. ' +
            'Defaults to the default created database'
        )
    );
    console.log(
        'migrations [ --destructive -- optional ]           ' +
        chalk.gray(
            'Checks to see if the database and the specified ' +
            'models are out of sync. Generates NO files.'
        )
    );
    console.log(
        'test                                               ' +
        chalk.gray(
            'Runs the Angie test suite and prints the results in the ' +
            'console'
        )
    );
    p.exit(0);
}