/**
 * @module BaseModel.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 8/23/2015
 */

// System Modules
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x10, _x11, _x12) { var _again = true; _function: while (_again) { var object = _x10, property = _x11, receiver = _x12; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x10 = parent; _x11 = property; _x12 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _chalk = require('chalk');

var _angieLog = require('angie-log');

var _angieLog2 = _interopRequireDefault(_angieLog);

// Angie Modules

var _databasesAngieDatabaseRouter = require('../databases/AngieDatabaseRouter');

var _databasesAngieDatabaseRouter2 = _interopRequireDefault(_databasesAngieDatabaseRouter);

var _util$ExceptionsProvider = require('../util/$ExceptionsProvider');

var IGNORE_KEYS = ['database', '$$database', 'model', 'name', 'fields', 'rows', 'update', 'first', 'last'];

var BaseModel = (function () {
    function BaseModel(name) {
        _classCallCheck(this, BaseModel);

        this.name = this.name || name;
    }

    _createClass(BaseModel, [{
        key: 'all',
        value: function all() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            args.model = this;

            // Returns all of the rows
            return this.$$prep.apply(this, arguments).all(args);
        }
    }, {
        key: 'fetch',
        value: function fetch() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            args.model = this;

            // Returns a subset of rows specified with an int and a head/tail argument
            return this.$$prep.apply(this, arguments).fetch(args);
        }
    }, {
        key: 'filter',
        value: function filter() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            args.model = this;

            // Returns a filtered subset of rows
            return this.$$prep.apply(this, arguments).filter(args);
        }
    }, {
        key: 'exists',
        value: function exists() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            args.model = args.model || this;
            return this.filter.apply(this, arguments).then(function (queryset) {
                return !!queryset[0];
            });
        }
    }, {
        key: 'create',
        value: function create() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            args.model = this;

            this.database = this.$$prep.apply(this, arguments);

            // Make sure all of our fields are resolved
            var createObj = {},
                me = this;

            this.$fields().forEach(function (field) {
                var val = args[field] || args.model[field]['default'] || null;
                if (typeof val === 'function') {
                    val = val.call(this, args);
                }
                if (me[field] && me[field].validate && me[field].validate(val)) {
                    createObj[field] = val;
                } else {
                    throw new _util$ExceptionsProvider.$$InvalidModelFieldReferenceError(me.name, field);
                }
            });

            // Once that is settled, we can call our create
            return this.database.create(args);
        }
    }, {
        key: '$createUnlessExists',
        value: function $createUnlessExists() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            args.model = this;

            // Check to see if a matching record exists and if not create it
            var me = this;
            return this.exists(args).then(function (v) {
                return me[v ? 'fetch' : 'create'](args);
            });
        }
    }, {
        key: 'delete',
        value: function _delete() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            args.model = this;

            // Delete a record/set of records
            return this.$$prep.apply(this, arguments)['delete'](args);
        }
    }, {
        key: 'query',
        value: function query(_query) {
            var args = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            if (typeof _query !== 'string') {
                return new Promise(function () {
                    arguments[1](new Error('Invalid Query String'));
                });
            }
            return this.$$prep.apply(this, args).raw(_query, this);
        }
    }, {
        key: '$fields',
        value: function $fields() {
            this.fields = [];
            for (var key in this) {
                if (typeof this[key] === 'object' && IGNORE_KEYS.indexOf(key) === -1) {
                    this.fields.push(key);
                }
            }
            return this.fields;
        }
    }, {
        key: '$$prep',
        value: function $$prep() {
            var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            var database = typeof args === 'object' && args.hasOwnProperty('database') ? args.database : null;

            // This forces the router to use a specific database, DB can also be
            // forced at a model level by using this.database
            this.$$database = (0, _databasesAngieDatabaseRouter2['default'])(database || this.database || 'default');
            return this.$$database;
        }
    }]);

    return BaseModel;
})();

var $$InvalidRelationCrossReferenceError = (function (_RangeError) {
    _inherits($$InvalidRelationCrossReferenceError, _RangeError);

    function $$InvalidRelationCrossReferenceError(method, field) {
        _classCallCheck(this, $$InvalidRelationCrossReferenceError);

        _angieLog2['default'].error('Cannot ' + method + ' reference on ' + (0, _chalk.cyan)(field.name) + ': ' + 'No such existing record.');
        _get(Object.getPrototypeOf($$InvalidRelationCrossReferenceError.prototype), 'constructor', this).call(this);
    }

    return $$InvalidRelationCrossReferenceError;
})(RangeError);

exports['default'] = BaseModel;
module.exports = exports['default'];