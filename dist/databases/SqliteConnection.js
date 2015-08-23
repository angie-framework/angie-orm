/**
 * @module SqliteConnection.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 8/23/2015
 */

// System Modules
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _sqlite3 = require('sqlite3');

var _sqlite32 = _interopRequireDefault(_sqlite3);

var _chalk = require('chalk');

var _angieLog = require('angie-log');

var _angieLog2 = _interopRequireDefault(_angieLog);

// Angie Modules

var _BaseDBConnection2 = require('./BaseDBConnection');

var _BaseDBConnection3 = _interopRequireDefault(_BaseDBConnection2);

var _util$ExceptionsProvider = require('../util/$ExceptionsProvider');

_sqlite32['default'].verbose();

var p = process;
_angieLog2['default'].sqliteInfo = _angieLog2['default'].info.bind(null, 'Sqlite');

var SqliteConnection = (function (_BaseDBConnection) {
    _inherits(SqliteConnection, _BaseDBConnection);

    function SqliteConnection(database, destructive, dryRun) {
        _classCallCheck(this, SqliteConnection);

        _get(Object.getPrototypeOf(SqliteConnection.prototype), 'constructor', this).call(this, database, destructive, dryRun);

        var db = this.database;
        if (!db.name) {
            throw new _util$ExceptionsProvider.$$InvalidDatabaseConfigError();
        }
        this.name = this.database.name || this.database.alias;
    }

    _createClass(SqliteConnection, [{
        key: 'types',
        value: function types(field) {
            var type = field.type;
            if (!type) {
                return;
            }
            switch (type) {
                case 'CharField':
                    return 'TEXT' + (field.nullable ? ' NOT NULL' : '');

                // TODO support different size integers: TINY, SMALL, MEDIUM
                case 'IntegerField':
                    return 'INTEGER' + (field.nullable ? ' NOT NULL' : '');
                case 'KeyField':
                    return 'INTEGER' + (field.nullable ? ' NOT NULL' : '');
                case 'ForeignKeyField':
                    return 'INTEGER REFERENCES ' + field.rel + '(id)';
                default:
                    return undefined;
            }
        }
    }, {
        key: 'connect',
        value: function connect() {
            var db = this.database;
            if (!this.connection) {
                try {
                    this.connection = new _sqlite32['default'].Database(this.name);
                    _angieLog2['default'].sqliteInfo('Connection successful');
                } catch (err) {
                    throw new _BaseDBConnection2.$$DatabaseConnectivityError(db);
                }
            }
            return this.connection;
        }
    }, {
        key: 'disconnect',
        value: function disconnect() {
            this.connect().close();
            return this;
        }
    }, {
        key: 'query',
        value: function query(_query, model, key) {
            var me = this,
                name = this.name;
            return new Promise(function (resolve) {
                _angieLog2['default'].sqliteInfo('Query: ' + (0, _chalk.cyan)(name) + ': ' + (0, _chalk.magenta)(_query));
                me.connect().parallelize(function () {
                    me.connection[key](_query, function (e) {
                        var rows = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

                        if (e) {
                            _angieLog2['default'].warn(e);
                        }
                        resolve([rows, e]);
                    });
                });
            }).then(function (args) {
                return me.$$queryset(model, _query, args[0], args[1]);
            });
        }
    }, {
        key: 'run',
        value: function run(query, model) {
            return this.query(query, model, 'run');
        }
    }, {
        key: 'all',
        value: function all() {
            var query = _get(Object.getPrototypeOf(SqliteConnection.prototype), 'all', this).apply(this, arguments);
            return this.query(query, arguments[0].model, 'all');
        }
    }, {
        key: 'create',
        value: function create() {
            var query = _get(Object.getPrototypeOf(SqliteConnection.prototype), 'create', this).apply(this, arguments);
            return this.query(query, arguments[0].model, 'all');
        }
    }, {
        key: 'delete',
        value: function _delete() {
            var query = _get(Object.getPrototypeOf(SqliteConnection.prototype), 'delete', this).apply(this, arguments);
            return this.query(query, arguments[0].model, 'all');
        }
    }, {
        key: 'update',
        value: function update() {
            var query = _get(Object.getPrototypeOf(SqliteConnection.prototype), 'update', this).apply(this, arguments);
            return this.query(query, arguments[0].model, 'all');
        }
    }, {
        key: 'raw',
        value: function raw(query, model) {
            return this.query(query, model, 'all');
        }
    }, {
        key: 'sync',
        value: function sync() {
            var me = this;
            _get(Object.getPrototypeOf(SqliteConnection.prototype), 'sync', this).call(this).then(function () {
                var proms = [];

                // TODO test this in another directory
                if (!_fs2['default'].existsSync(me.name)) {

                    // Connection does not exist and we must touch the db file
                    _fs2['default'].closeSync(_fs2['default'].openSync(me.name, 'w'));
                }

                var models = me.models();
                for (var model in models) {

                    // Fetch models and get model name
                    var instance = models[model],
                        modelName = instance.name || instance.alias || me.$$name(instance);

                    // Run a table creation with an ID for each table
                    proms.push(me.run('CREATE TABLE ' + modelName + ' ' + '(id INTEGER PRIMARY KEY AUTOINCREMENT);', modelName));
                }
                return Promise.all(proms).then(function () {
                    return me.migrate();
                });
            });
        }
    }, {
        key: 'migrate',
        value: function migrate() {
            var me = this;
            return _get(Object.getPrototypeOf(SqliteConnection.prototype), 'migrate', this).call(this).then(function () {
                var models = me.models(),
                    proms = [],
                    logged = true;

                var _loop = function (key) {
                    var model = models[key],
                        modelName = me.$$name(model.name || model.alias),
                        fields = model.$fields();
                    if (me.destructive && logged) {

                        // TODO recommmend that the user copy the table over
                        // without the column, delete the original, and
                        // rename the table
                        _angieLog2['default'].error('You have specified a destructive Migration and ' + ('have fields in the ' + (0, _chalk.cyan)(modelName) + ' model ') + 'which do not exist in your app.Model code. ' + 'However, sqlite3 destructive migrations are not ' + 'supported. Please see the docs for more info.');
                        logged = false;
                    }

                    fields.forEach(function (v) {
                        if (model[v].type === 'ManyToManyField') {
                            return;
                        }

                        var query = undefined,
                            $default = undefined;
                        if (model[v]['default']) {
                            $default = model[v]['default'];
                            if (typeof $default === 'function') {
                                $default = $default();
                            }
                        }
                        query = 'ALTER TABLE ' + modelName + ' ADD COLUMN ' + v + ' ' + ('' + me.types(model[v])) + ('' + (model[v].unique ? ' UNIQUE' : '')) + (($default ? ' DEFAULT \'' + $default + '\'' : '') + ';');
                        if (!me.dryRun) {
                            proms.push(me.run(query));
                        } else {
                            _angieLog2['default'].sqliteInfo('Dry Run Query: ' + (0, _chalk.gray)(query));
                        }
                    });
                };

                for (var key in models) {
                    _loop(key);
                }
                return Promise.all(proms);
            }).then(function () {
                me.disconnect();
                _angieLog2['default'].sqliteInfo('Successfully Synced & Migrated ' + (0, _chalk.cyan)(me.name));
                p.exit(0);
            });
        }
    }]);

    return SqliteConnection;
})(_BaseDBConnection3['default']);

exports['default'] = SqliteConnection;
module.exports = exports['default'];