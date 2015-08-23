/**
 * @module BaseDBConnection.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 8/23/2015
 */

// System Modules
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x17, _x18, _x19) { var _again = true; _function: while (_again) { var object = _x17, property = _x18, receiver = _x19; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x17 = parent; _x18 = property; _x19 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _chalk = require('chalk');

var _angieLog = require('angie-log');

var _angieLog2 = _interopRequireDefault(_angieLog);

// Angie ORM Modules

var _util$ExceptionsProvider = require('../util/$ExceptionsProvider');

// Keys we do not necessarily want to parse as query arguments
var p = process,
    IGNORE_KEYS = ['database', 'tail', 'head', 'rows', 'values', 'model'];

/**
 * @desc BaseDBConnection is a private class which is not exposed to the Angie
 * provider. It contains all of the methods quintessential to making DB queries
 * regardless of DB vehicle. Some of the methods in this class are specific to
 * SQL type DBs and will need to be replaced when subclassed. This should be the
 * base class used for each DB type
 * @since 0.2.3
 * @access private
 */

var BaseDBConnection = (function () {

    /**
     * @param {object} database The database object to which the connection is
     * being made
     * @param {boolean} destructive Should destructive migrations be run?
     */

    function BaseDBConnection(database) {
        var destructive = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        var dryRun = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

        _classCallCheck(this, BaseDBConnection);

        this.database = database;
        this.destructive = destructive;
        this.dryRun = dryRun;
    }

    _createClass(BaseDBConnection, [{
        key: 'models',
        value: function models() {
            return this._models;
        }
    }, {
        key: 'all',
        value: function all() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
            var fetchQuery = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
            var filterQuery = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

            if (!args.model || !args.model.name) {
                throw new _util$ExceptionsProvider.$$InvalidModelReferenceError();
            }

            var values = '*';
            if (typeof args.values === 'object' && args.values.length) {
                values = args.values;
                if (values.indexOf('id') === -1) {
                    values.unshift('id');
                }
            }

            return 'SELECT ' + values + ' FROM ' + args.model.name + ('' + (filterQuery ? ' WHERE ' + filterQuery : '')) + ((fetchQuery ? ' ' + fetchQuery : '') + ';');
        }
    }, {
        key: 'fetch',
        value: function fetch() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
            var filterQuery = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

            var ord = 'ASC';

            if (args.head && args.head === false || args.tail && args.tail === true) {
                ord = 'DESC';
            }

            var int = args.rows || 1,
                fetchQuery = 'ORDER BY id ' + ord + ' LIMIT ' + int;
            return this.all(args, fetchQuery, filterQuery);
        }
    }, {
        key: 'filter',
        value: function filter() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            return this.fetch(args, this.$$filterQuery(args));
        }

        /**
         * @desc _fitlerQuery builds the "WHERE" statements of queries. It is
         * responsible for parsing all query conditions
         * @since 0.2.2
         * @param {object} args Object representation of the arguments
         * @param {string} args.key Name and value/conditions of field to be parsed.
         * Values can be prefixed with the following comparators:
         *     "~": "Like", >, >=, <, <=
         * @param {object|Array<>} args.values Fields for an "in" query
         * @returns {string} A query string to be passed to the performed query
         * @access private
         */
    }, {
        key: '$$filterQuery',
        value: function $$filterQuery(args) {
            var filterQuery = [],
                fn = function fn(k, v) {

                // If we're dealing with a number...
                if (typeof v === 'number') {
                    return k + '=' + v;
                } else if (v.indexOf('~') > -1) {

                    // If there is a like operator, add a like phrase
                    return k + ' like \'%' + v.replace(/~/g, '') + '%\'';
                } else if (/(<=?|>=?)[^<>=]+/.test(v) && v.indexOf('>>') === -1 && v.indexOf('<<') === -1) {

                    // If there is a condition, parse it, use as operator
                    // ^^ TODO there has to be a better way to do that condition
                    return v.replace(/(<=?|>=?)([^<>=]+)/, function (m, p, v) {
                        return '' + k + p + (!isNaN(v) ? v : '\'' + v + '\'');
                    });
                }

                // Otherwise, return equality
                return k + '=\'' + v.replace(/[<>=]*/g, '') + '\'';
            };
            for (var key in args) {
                if (IGNORE_KEYS.indexOf(key) > -1) {
                    continue;
                }
                if (args[key] && typeof args[key] !== 'object') {
                    filterQuery.push(fn(key, args[key]));
                } else {
                    filterQuery.push(key + ' in ' + this.$$queryInString(args[key]));
                }
            }
            return filterQuery.length ? '' + filterQuery.join(' AND ') : '';
        }
    }, {
        key: 'create',
        value: function create() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            var keys = Object.keys(args),
                queryKeys = [],
                values = [];

            if (!args.model || !args.model.name) {
                throw new _util$ExceptionsProvider.$$InvalidModelReferenceError();
            }

            keys.forEach(function (key) {
                if (IGNORE_KEYS.indexOf(key) === -1) {
                    queryKeys.push(key);
                    values.push('\'' + args[key] + '\'');
                }
            });

            return 'INSERT INTO ' + args.model.name + ' (' + queryKeys.join(', ') + ') ' + ('VALUES (' + values.join(', ') + ');');
        }
    }, {
        key: 'delete',
        value: function _delete() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            return 'DELETE FROM ' + args.model.name + ' WHERE ' + this.$$filterQuery(args) + ';';
        }
    }, {
        key: 'update',
        value: function update() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            if (!args.model || !args.model.name) {
                throw new _util$ExceptionsProvider.$$InvalidModelReferenceError();
            }

            var filterQuery = this.$$filterQuery(args),
                idSet = this.$$queryInString(args.rows, 'id');
            if (!filterQuery) {
                _angieLog2['default'].warn('No filter query in UPDATE statement.');
            } else {
                return 'UPDATE ' + args.model.name + ' SET ' + filterQuery + ' WHERE id in ' + idSet + ';';
            }
        }

        /**
         * @desc $$queryInString builds any "in" query statements in the query
         * arguments
         * @since 0.2.2
         * @param {object} args Object representation of the arguments
         * @param {string} args.key Name and value/conditions of field to be parsed
         * @param {object|Array<>} args.values Fields for an "in" query
         * @param {string} key The name of the key to parse for "in" arguments
         * @returns {string} A query string to be passed to the performed query
         * @access private
         */
    }, {
        key: '$$queryInString',
        value: function $$queryInString(args, key) {
            if (args === undefined) args = {};

            var fieldSet = [];
            if (key) {
                args.forEach(function (row) {
                    fieldSet.push('\'' + row[key] + '\'');
                });
            } else if (args instanceof Array) {
                fieldSet = args.map(function (v) {
                    return '\'' + v + '\'';
                });
            }
            return '(' + (fieldSet.length ? fieldSet.join(',') : '') + ')';
        }
    }, {
        key: 'sync',
        value: function sync() {
            var me = this;

            // Every instance of sync needs a registry of the models, which implies
            return global.app.$$load().then(function () {
                me._models = global.app.Models;
                _angieLog2['default'].info('Synccing database: ' + (0, _chalk.cyan)(me.database.name || me.database.alias));
            });
        }
    }, {
        key: 'migrate',
        value: function migrate() {
            var me = this;

            // Every instance of sync needs a registry of the models, which implies
            return global.app.$$load().then(function () {
                me._models = global.app.Models;
                _angieLog2['default'].info('Migrating database: ' + (0, _chalk.cyan)(me.database.name || me.database.alias));
            });
        }
    }, {
        key: '$$queryset',
        value: function $$queryset(model, query, rows, errors) {
            if (model === undefined) model = {};
            if (rows === undefined) rows = [];

            var queryset = new AngieDBObject(this, model, query);
            var results = [],
                manyToManyFieldNames = [],
                rels = [],
                relFieldNames = {},
                relArgs = {},
                proms = [];

            for (var key in model) {
                var field = model[key];
                if (field.type && field.type === 'ManyToManyField') {
                    manyToManyFieldNames.push(key);
                }
            }

            if (rows instanceof Array) {
                rows.forEach(function (v) {

                    // Create a copy to be added to the raw results set
                    var $v = _util2['default']._extend({}, v);

                    // Add update method to row to allow the single row to be
                    // updated
                    v.update = queryset.$$update.bind(queryset, v);

                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = manyToManyFieldNames[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var key = _step.value;

                            var field = model[key],
                                many = v[key] = {};
                            var _arr = ['add', 'remove'];
                            for (var _i = 0; _i < _arr.length; _i++) {
                                var method = _arr[_i];
                                many[method] = queryset.$$addOrRemove.bind(queryset, method, field, v.id);
                            }
                            var _arr2 = ['all', 'fetch', 'filter'];
                            for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
                                var method = _arr2[_i2];
                                many[method] = queryset.$$readMethods.bind(queryset, method, field, v.id);
                            }
                        }

                        // Find all of the foreign key fields
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator['return']) {
                                _iterator['return']();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }

                    for (var key in v) {
                        var field = model[key];
                        if (field && (field.nesting === true || field.deepNesting === true)) {
                            rels.push(field.rel);
                            relFieldNames[field.rel] = key;
                            relArgs[field.rel] = rows.map(function (v) {
                                return v.id;
                            });
                        }
                    }

                    results.push($v);
                });
            }

            // Add update method to row set so that the whole queryset can be
            // updated
            rows.update = queryset.$$update.bind(queryset, rows);

            // Remove reference methods
            delete queryset.$$update;
            delete queryset.$$addOrRemove;
            delete queryset.$$readMethods;

            // Instantiate a promise for each of the foreign key fields in the query
            rels.forEach(function (v) {

                // Reference the relative object
                proms.push(global.app.Models[v].filter({
                    database: model.$$database.name,
                    id: relArgs[v]
                }).then(function (queryset) {

                    // Add errors to queryset errors
                    if (errors === null) {
                        errors = [];
                    }

                    // Add any errors to the queryset
                    errors.push(queryset.errors);

                    rows.forEach(function (row, i) {
                        queryset.forEach(function (queryrow) {
                            if (!isNaN(+row[relFieldNames[v]]) && queryrow.hasOwnProperty('id') && row[relFieldNames[v]] === queryrow.id) {

                                // Assign the nested row
                                results[i][relFieldNames[v]] = queryset.results[i];
                                row[relFieldNames[v]] = queryrow;
                            } else {
                                results[i][relFieldNames[v]] = row[relFieldNames[v]] = null;
                            }
                        });
                    });
                }));
            });

            return Promise.all(proms).then(function () {

                // Resolves to a value in the connections currently
                return _util2['default']._extend(rows, {

                    // The raw query results
                    results: results,

                    // Any errors
                    errors: errors,

                    first: AngieDBObject.prototype.first,
                    last: AngieDBObject.prototype.last
                }, queryset);
            });
        }
    }, {
        key: '$$name',
        value: function $$name(modelName) {
            modelName = modelName.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (modelName.charAt(0) === '_') {
                modelName = modelName.slice(1, modelName.length);
            }
            return modelName;
        }
    }]);

    return BaseDBConnection;
})();

var AngieDBObject = (function () {
    function AngieDBObject(database, model) {
        var query = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

        _classCallCheck(this, AngieDBObject);

        if (!database || !model) {
            return;
        }
        this.database = database;
        this.model = model;
        this.query = query;
    }

    _createClass(AngieDBObject, [{
        key: 'first',
        value: function first() {
            return this[0];
        }
    }, {
        key: 'last',
        value: function last() {
            return this.pop();
        }
    }, {
        key: '$$update',
        value: function $$update(rows) {
            var args = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            // This should only be called internally, so it's not a huge hack:
            // rows either references the whole queryset or just a single row
            args.rows = rows instanceof Array ? rows : [rows];
            args.model = this.model;

            if (typeof args !== 'object') {
                return;
            }

            var updateObj = {};
            for (var key in args) {
                var val = args[key] || null;
                if (IGNORE_KEYS.indexOf(key) > -1) {
                    continue;
                } else if (this.model[key] && this.model[key].validate && this.model[key].validate(val)) {
                    updateObj[key] = val;
                } else {
                    throw new _util$ExceptionsProvider.$$InvalidModelFieldReferenceError(this.model.name, key);
                }
            }

            _util2['default']._extend(args, updateObj);
            return this.database.update(args);
        }
    }, {
        key: '$$addOrRemove',
        value: function $$addOrRemove(method, field, id) {
            var obj = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
            var extra = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

            switch (method) {
                case 'add':
                    method = '$createUnlessExists';
                    break;
                default:
                    // 'remove'
                    method = 'delete';
            }

            // Get database, other extra options
            obj = _util2['default']._extend(obj, extra);

            // Check to see that there is an existing related object
            return global.app.Models[field.rel].exists(obj).then(function (v) {

                // Check to see if a reference already exists <->
                if (v) {
                    var _util$_extend;

                    var $obj = _util2['default']._extend((_util$_extend = {}, _defineProperty(_util$_extend, field.name + '_id', id), _defineProperty(_util$_extend, field.rel + '_id', obj.id), _util$_extend), extra);
                    return field.crossReferenceTable[method]($obj);
                }
                throw new Error();
            })['catch'](function () {
                throw new _util$ExceptionsProvider.$$InvalidRelationCrossReferenceError(method, field, id, obj);
            });
        }
    }, {
        key: '$$readMethods',
        value: function $$readMethods(method, field, id) {
            var _util$_extend2;

            var args = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

            args = _util2['default']._extend(args, (_util$_extend2 = {}, _defineProperty(_util$_extend2, field.name + '_id', id), _defineProperty(_util$_extend2, 'values', [field.rel + '_id']), _util$_extend2));
            method = ['filter', 'fetch'].indexOf(method) > -1 ? method : 'filter';
            return field.crossReferenceTable[method](args);
        }
    }]);

    return AngieDBObject;
})();

var $$DatabaseConnectivityError = (function (_Error) {
    _inherits($$DatabaseConnectivityError, _Error);

    function $$DatabaseConnectivityError(database) {
        _classCallCheck(this, $$DatabaseConnectivityError);

        var message = undefined;
        switch (database.type) {
            case 'mysql':
                message = 'Could not find MySql database ' + ((0, _chalk.cyan)(database.name || database.alias) + '@') + ((database.host || '127.0.0.1') + ':' + (database.port || 3306));
                break;
            default:
                message = 'Could not find ' + (0, _chalk.cyan)(database.name) + ' in filesystem.';
        }
        _angieLog2['default'].error(message);
        _get(Object.getPrototypeOf($$DatabaseConnectivityError.prototype), 'constructor', this).call(this);
        p.exit(1);
    }

    return $$DatabaseConnectivityError;
})(Error);

exports['default'] = BaseDBConnection;
exports.$$DatabaseConnectivityError = $$DatabaseConnectivityError;