/**
 * @module MySqlConnection.js
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

var _mysql = require('mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _chalk = require('chalk');

var _angieLog = require('angie-log');

var _angieLog2 = _interopRequireDefault(_angieLog);

// Angie Modules

var _BaseDBConnection2 = require('./BaseDBConnection');

var _BaseDBConnection3 = _interopRequireDefault(_BaseDBConnection2);

var _util$ExceptionsProvider = require('../util/$ExceptionsProvider');

var p = process,
    DEFAULT_HOST = '127.0.0.1',
    DEFAULT_PORT = 3306;
_angieLog2['default'].mysqlInfo = _angieLog2['default'].info.bind(null, 'MySQL');

var MySqlConnection = (function (_BaseDBConnection) {
    _inherits(MySqlConnection, _BaseDBConnection);

    function MySqlConnection(name, database, destructive, dryRun) {
        _classCallCheck(this, MySqlConnection);

        _get(Object.getPrototypeOf(MySqlConnection.prototype), 'constructor', this).call(this, database, destructive, dryRun);
        var db = this.database;

        if (!db.username) {
            throw new _util$ExceptionsProvider.$$InvalidDatabaseConfigError(db);
        } else if (!this.connection) {
            this.name = name || this.database.name || this.database.alias;
            this.connection = _mysql2['default'].createConnection({
                host: db.host || DEFAULT_HOST,
                port: db.port || DEFAULT_PORT,
                user: db.username || '',
                password: db.password || '',
                database: this.name
            });

            this.connection.on('error', function () {
                if (db.options && db.options.hardErrors) {
                    throw new _util$ExceptionsProvider.$$InvalidDatabaseConfigError(db);
                }
            });

            this.connected = false;
        }
    }

    _createClass(MySqlConnection, [{
        key: 'types',
        value: function types(model, key) {
            var field = model[key];
            var type = field.type,
                maxLength = '';
            if (!type) {
                return;
            }
            if (field.maxLength) {
                maxLength = '(' + field.maxLength + ')';
            }
            switch (type) {
                case 'CharField':
                    return 'VARCHAR' + maxLength;

                // TODO support different size integers: TINY, SMALL, MEDIUM
                case 'IntegerField':
                    return 'INTEGER' + maxLength;
                case 'KeyField':
                    return 'INTEGER' + maxLength;
                case 'ForeignKeyField':
                    return 'INTEGER' + maxLength + ', ADD CONSTRAINT fk_' + key + ' FOREIGN KEY(' + key + ') ' + ('REFERENCES ' + field.rel + '(id) ON DELETE CASCADE');
                default:
                    return undefined;
            }
        }
    }, {
        key: 'connect',
        value: function connect() {
            var me = this;
            return new Promise(function (resolve) {
                if (me.connected === false) {
                    me.connection.connect(function (e) {

                        // TODO add this back in?
                        if (e) {
                            // throw new $$DatabaseConnectivityError(me.database);
                            _angieLog2['default'].error(e);
                        } else {
                            me.connected = true;
                            _angieLog2['default'].mysqlInfo('Connection successful');
                        }
                    });
                }
                resolve();
            });
        }
    }, {
        key: 'disconnect',
        value: function disconnect() {
            this.connection.end();
            this.connected = false;
        }
    }, {
        key: 'run',
        value: function run(query, model) {
            var me = this,
                name = this.name;
            return this.connect().then(function () {
                return new Promise(function (resolve) {
                    _angieLog2['default'].mysqlInfo('Query: ' + (0, _chalk.cyan)(name) + ': ' + (0, _chalk.magenta)(query));
                    return me.connection.query(query, function (e) {
                        var rows = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

                        if (e) {
                            _angieLog2['default'].warn(e);
                        }
                        resolve([rows, e]);
                    });
                });
            }).then(function (args) {
                return me.$$queryset(model, query, args[0], args[1]);
            });
        }
    }, {
        key: 'all',
        value: function all() {
            var query = _get(Object.getPrototypeOf(MySqlConnection.prototype), 'all', this).apply(this, arguments);
            return this.run(query, arguments[0].model);
        }
    }, {
        key: 'create',
        value: function create() {
            var query = _get(Object.getPrototypeOf(MySqlConnection.prototype), 'create', this).apply(this, arguments);
            return this.run(query, arguments[0].model);
        }
    }, {
        key: 'delete',
        value: function _delete() {
            var query = _get(Object.getPrototypeOf(MySqlConnection.prototype), 'delete', this).apply(this, arguments);
            return this.run(query, arguments[0].model);
        }
    }, {
        key: 'update',
        value: function update() {
            var query = _get(Object.getPrototypeOf(MySqlConnection.prototype), 'update', this).apply(this, arguments);
            return this.run(query, arguments[0].model);
        }
    }, {
        key: 'raw',
        value: function raw(query, model) {
            return this.run(query, model);
        }
    }, {
        key: 'sync',
        value: function sync() {
            var me = this;

            // Don't worry about the error state, handled by connection
            return _get(Object.getPrototypeOf(MySqlConnection.prototype), 'sync', this).call(this).then(function () {
                var models = me.models(),
                    proms = [];

                for (var model in models) {

                    // Fetch models and get model name
                    var instance = models[model],
                        modelName = instance.name || instance.alias || me.$$name(model);

                    // Run a table creation with an ID for each table
                    proms.push(me.run('CREATE TABLE `' + modelName + '` ' + '(`id` int(11) NOT NULL AUTO_INCREMENT, ' + 'PRIMARY KEY (`id`) ' + ') ENGINE=InnoDB DEFAULT CHARSET=latin1;'));
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
            return _get(Object.getPrototypeOf(MySqlConnection.prototype), 'migrate', this).call(this).then(function () {
                return me.run('SHOW TABLES').then(function (queryset) {
                    return queryset;
                });
            }).then(function (queryset) {
                // const modelMap = [
                //     for (model of queryset) model[ `Tables_in_${me.name}` ]
                // ];
                var modelMap = queryset.map(function (v) {
                    return v['Tables_in_' + me.name];
                });
                var models = me.models(),
                    proms = [];
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = modelMap[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var key = _step.value;

                        var prom = undefined;
                        if (!models.hasOwnProperty(key)) {

                            // Don't consolidate, we don't want to look at the fields
                            if (me.destructive) {
                                prom = me.run('DROP TABLE `' + key + '`;');
                            }
                        } else {
                            (function () {
                                var model = models[key],
                                    modelName = me.$$name(model.name || model.alias),
                                    fields = model.$fields();
                                prom = me.run('SHOW COLUMNS from `' + modelName + '`;', modelName).then(function (queryset) {
                                    var proms = [];
                                    queryset.forEach(function (v) {
                                        if (fields.indexOf(v.Field) === -1 && v.Field !== 'id' && me.destructive) {
                                            (function () {
                                                var baseQuery = 'ALTER TABLE `' + modelName + '` ',
                                                    query = baseQuery + 'DROP COLUMN `' + v.Field + '`;',
                                                    keyQuery = undefined;
                                                if (v.Key) {
                                                    keyQuery = baseQuery + 'DROP FOREIGN KEY ' + ('`fk_' + v.Field + '`;');
                                                }
                                                if (!me.dryRun) {
                                                    var _prom = undefined;
                                                    if (keyQuery) {
                                                        _prom = me.run(keyQuery).then(function () {
                                                            return me.run(query);
                                                        });
                                                    } else {
                                                        _prom = me.run(query);
                                                    }
                                                    proms.push(_prom);
                                                } else {
                                                    _angieLog2['default'].mysqlInfo('Dry Run Query: ' + (0, _chalk.gray)(keyQuery + ' ' + query));
                                                }
                                            })();
                                        }
                                    });

                                    // TODO you've got to return if many to many here
                                    fields.forEach(function (v) {
                                        if (model[v].type === 'ManyToManyField') {
                                            return;
                                        }
                                        if (queryset.map(function ($v) {
                                            return $v.Field;
                                        }).indexOf(v) === -1) {
                                            var query = undefined,
                                                $default = undefined;
                                            if (model[v]['default']) {
                                                $default = model[v]['default'];
                                                if (typeof $default === 'function') {
                                                    $default = $default();
                                                }
                                            }
                                            query = 'ALTER TABLE `' + modelName + '` ADD COLUMN `' + v + '` ' + ('' + me.types(model, v)) + ('' + (model[v].nullable ? '' : ' NOT NULL')) + ('' + (model[v].unique ? ' UNIQUE' : '')) + (($default ? ' DEFAULT \'' + $default + '\'' : '') + ';');
                                            if (!me.dryRun) {
                                                proms.push(me.run(query));
                                            } else {
                                                _angieLog2['default'].mysqlInfo('Dry Run Query: ' + (0, _chalk.gray)(query));
                                            }
                                        }
                                    });
                                    return Promise.all(proms);
                                });
                            })();
                        }
                        proms.push(prom);
                    }
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

                return Promise.all(proms);
            }).then(function () {
                me.disconnect();
                _angieLog2['default'].mysqlInfo('Successfully Synced & Migrated ' + (0, _chalk.cyan)(me.name));
                p.exit(0);
            });
        }
    }]);

    return MySqlConnection;
})(_BaseDBConnection3['default']);

exports['default'] = MySqlConnection;
module.exports = exports['default'];