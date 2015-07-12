'use strict'; 'use strong';

// System Modules
import fs from                      'fs';
import $LogProvider from            'angie-log';

// Angie ORM Modules
import * as $$FieldProvider from    './models/Fields';


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

            // Do not call load twice
            if (this.$$loaded === true) {
                return new Promise((r) => { r(); });
            }

            let me = this;
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
                    try {
                        require(v);
                        $LogProvider.info(`Successfully loaded file ${v}`);
                    } catch(e) {
                        $LogProvider.error(e);
                    }
                });

                // Set the app in a loaded state
                me.$$loaded = true;
                resolve();
            });
        },
        $$loaded: false
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