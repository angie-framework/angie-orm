/**
 * @module index.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 8/23/2015
 */

// System Modules
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _child_process = require('child_process');

var _chalk = require('chalk');

var _angieLog = require('angie-log');

var _angieLog2 = _interopRequireDefault(_angieLog);

// Angie ORM Global Modules

require('./Angie');

// Angie ORM Modules

var _databasesAngieDatabaseRouter = require('./databases/AngieDatabaseRouter');

var _databasesAngieDatabaseRouter2 = _interopRequireDefault(_databasesAngieDatabaseRouter);

var _models$Fields = require('./models/$Fields');

var $$FieldProvider = _interopRequireWildcard(_models$Fields);

var p = process;
var args = [];

// Remove trivial arguments
p.argv.forEach(function (v) {
    if (!v.match(/(node|iojs|index|help|angie(\-orm)?)/)) {
        args.push(v);
    } else if (v === 'help') {
        help();
    }
});

// Route the CLI request to a specific command if running from CLI
if (args.length && args.some(function (v) {
    return ['syncdb', 'migrate', 'test'].indexOf(v) > -1;
})) {
    switch ((args[0] || '').toLowerCase()) {
        case 'syncdb':
            (0, _databasesAngieDatabaseRouter2['default'])(args).sync();
            break;
        case 'migrate':
            (0, _databasesAngieDatabaseRouter2['default'])(args).migrate();
            break;
        default:
            runTests();
    }
}

function runTests() {

    // TODO is there any way to carry the stream output from gulp instead
    // of capturing stdout?
    (0, _child_process.exec)('cd ' + __dirname + ' && gulp', function (e, std, err) {
        _angieLog2['default'].info(std);
        if (err) {
            _angieLog2['default'].error(err);
        }
        if (e) {
            throw new Error(e);
        }
    });
}

function help() {
    _angieLog2['default'].bold('Angie ORM');
    console.log('A flexible, Promise-based ORM for the Angie MVC');
    console.log('\r');
    _angieLog2['default'].bold('Version:');
    console.log(global.ANGIE_ORM_VERSION);
    console.log('\r');
    _angieLog2['default'].bold('Commands:');
    console.log('syncdb [ database ]                                                   ' + (0, _chalk.gray)('Sync the current specified databases in the AngieFile. ' + 'Defaults to the default created database'));
    console.log('migrations [ --destructive -- optional ] [ --dryrun -- optional ]     ' + (0, _chalk.gray)('Checks to see if the database and the specified ' + 'models are out of sync. Generates NO files.'));
    console.log('test                                                                  ' + (0, _chalk.gray)('Runs the Angie test suite and prints the results in the ' + 'console'));
    p.exit(0);
}

exports.$$Fields = $$FieldProvider;