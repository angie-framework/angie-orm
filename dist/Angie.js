/**
 * @module Angie.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 8/23/2015
 */

// System Modules
'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _chalk = require('chalk');

var _angieLog = require('angie-log');

var _angieLog2 = _interopRequireDefault(_angieLog);

// Angie ORM Modules

var _modelsBaseModel = require('./models/BaseModel');

var _modelsBaseModel2 = _interopRequireDefault(_modelsBaseModel);

var _models$Fields = require('./models/$Fields');

var $$FieldProvider = _interopRequireWildcard(_models$Fields);

var _util$ExceptionsProvider = require('./util/$ExceptionsProvider');

// Setup the app or inherit the app from the `global` Namespace
var p = process;
var app = undefined;

if (global.app) {
    app = global.app;
} else {
    app = global.app = {
        services: {},
        $$registry: {},
        $$register: function $$register(c, name, obj) {

            // `component` and `app.component` should always be defined
            if (name && obj) {
                this.$$registry[name] = 'Models';
                this.Models[name] = obj;
            } else {
                _angieLog2['default'].warn('Invalid name or object called on app.$register');
            }
            return this;
        },
        $$load: function $$load() {
            var fs = require('fs');

            // Do not call load twice
            if (this.$$loaded === true) {
                return new Promise(function (r) {
                    r();
                });
            }

            var me = this;
            return new Promise(function (resolve) {
                var files = [];

                // Find ALL the files
                try {
                    files = files.concat(fs.readdirSync(p.cwd() + '/src').map(function (v) {
                        return p.cwd() + '/src/' + v;
                    }));
                } catch (e) {}
                try {
                    files = files.concat(fs.readdirSync(p.cwd() + '/src/Models').map(function (v) {
                        return p.cwd() + '/src/Models/' + v;
                    }));
                } catch (e) {}
                try {
                    files = files.concat(fs.readdirSync(p.cwd() + '/src/models').map(function (v) {
                        return p.cwd() + '/src/models/' + v;
                    }));
                } catch (e) {}

                // Make sure the files are js/es6 files, then try to load them
                files.filter(function (v) {
                    return ['js', 'es6'].indexOf(v.split('.').pop()) > -1;
                }).forEach(function (v) {
                    try {
                        require(v);
                        _angieLog2['default'].info('Successfully loaded file ' + (0, _chalk.blue)(v));
                    } catch (e) {
                        _angieLog2['default'].error(e);
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
    app.services.$Log = _angieLog2['default'];
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
app.Model = function Model(name) {
    var Obj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var model = typeof Obj === 'function' ? new Obj($$FieldProvider) : typeof Obj === 'object' ? Obj : undefined;

    model.name = model.name || name;
    var instance = new _modelsBaseModel2['default'](model.name);

    // Mock extend obj onto the instance
    if (typeof model === 'object') {
        instance = _util2['default']._extend(instance, model);
    } else {
        throw new _util$ExceptionsProvider.$$InvalidModelConfigError(name);
    }
    this.$$register('Models', model.name, instance);

    // We need to account for whether this Model creates a m2m reference and
    // create the reverse
    for (var key in model) {
        var field = model[key];
        if (field.type && field.type === 'ManyToManyField') {
            this.Models[field.rel][field.name] = new $$FieldProvider.ManyToManyField(field.name, {
                crossReferenceTableId: field.crossReferenceTableId,
                crossReferenceTable: field.crossReferenceTable,
                name: field.rel
            });
        }
    }

    return this;
};