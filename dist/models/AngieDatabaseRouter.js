/**
 * @module AngieDatabaseRouter.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 8/23/2015
 */

// System Modules
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

// Angie ORM Modules

var _SqliteConnection = require('./SqliteConnection');

var _SqliteConnection2 = _interopRequireDefault(_SqliteConnection);

var _MySqlConnection = require('./MySqlConnection');

var _MySqlConnection2 = _interopRequireDefault(_MySqlConnection);

var _FirebaseConnection = require('./FirebaseConnection');

var _FirebaseConnection2 = _interopRequireDefault(_FirebaseConnection);

var _MongoDBConnection = require('./MongoDBConnection');

var _MongoDBConnection2 = _interopRequireDefault(_MongoDBConnection);

var _util$ExceptionsProvider = require('../util/$ExceptionsProvider');

var p = process;
var app = undefined,
    dbs = {},
    config = undefined;

function AngieDatabaseRouter(args) {
    app = app || global.app;

    var database = undefined,
        name = 'default';

    if (!config && !global.app.$$config) {
        try {
            var $$config = JSON.parse(_fs2['default'].readFileSync(process.cwd() + '/AngieORMFile.json'));

            if (typeof $$config === 'object') {
                global.app.$$config = $$config;
                Object.freeze(app.$$config);
            } else {
                throw new Error();
            }
        } catch (e) {
            throw new _util$ExceptionsProvider.$$InvalidConfigError();
        }
    }
    config = global.app.$$config;

    if (args instanceof Array) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = args[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var arg = _step.value;

                if (Object.keys(config.databases).indexOf(arg) > -1) {
                    name = arg;
                    break;
                }
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
    } else if (typeof args === 'string') {
        name = args;
    }

    // Check to see if the database is in memory
    database = dbs[name];
    if (database) {
        return database;
    }

    // Try to fetch database by name or try to grab default
    var db = config.databases && config.databases[name] ? config.databases[name] : config.databases['default'] ? config.databases['default'] : null,
        destructive = p.argv.some(function (v) {
        return (/--destructive/i.test(v)
        );
    }),
        dryRun = p.argv.some(function (v) {
        return (/--dry([-_])?run/i.test(v)
        );
    });

    if (db && db.type) {
        switch (db.type.toLowerCase()) {
            case 'mysql':
                database = new _MySqlConnection2['default'](name, db, destructive, dryRun);
                break;
            case 'mongodb':
                database = new _MongoDBConnection2['default'](db, destructive, dryRun);
                break;
            case 'firebase':
                database = new _FirebaseConnection2['default'](db, destructive, dryRun);
                break;
            default:
                database = new _SqliteConnection2['default'](db, destructive, dryRun);
        }
    }

    if (!database) {
        throw new _util$ExceptionsProvider.$$InvalidDatabaseConfigError();
    }

    // Setup a cache of database connections in memory already
    dbs[name] = database;
    return database;
}

exports['default'] = AngieDatabaseRouter;
module.exports = exports['default'];