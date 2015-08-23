/**
 * @module $Fields.js
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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _chalk = require('chalk');

var _angieLog = require('angie-log');

var _angieLog2 = _interopRequireDefault(_angieLog);

var p = process;

var BaseField = (function () {
    function BaseField() {
        var args = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
        var maxValue = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];
        var minLength = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
        var maxLength = arguments.length <= 3 || arguments[3] === undefined ? undefined : arguments[3];
        var nullable = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];
        var unique = arguments.length <= 5 || arguments[5] === undefined ? false : arguments[5];
        var $default = arguments.length <= 6 || arguments[6] === undefined ? undefined : arguments[6];

        _classCallCheck(this, BaseField);

        this.type = 'BaseField';
        if (typeof args === 'object') {
            _util2['default']._extend(this, arguments[0]);
        } else if (!isNaN(args)) {
            if (args === 1) {
                return;
            }
            var _ref = [args, maxValue, minLength, maxLength, nullable, unique, $default];
            this.minValue = _ref[0];
            this.maxValue = _ref[1];
            this.minLength = _ref[2];
            this.maxLength = _ref[3];
            this.nullable = _ref[4];
            this.unique = _ref[5];
            this['default'] = _ref[6];
        }
    }

    _createClass(BaseField, [{
        key: 'create',
        value: function create() {

            // TODO this method is not responsible for migrating a model, only
            // creating a field in a record when the model is instantiated
            if (this['default']) {
                if (this.validate(this['default'])) {
                    this.value = typeof this['default'] === 'function' ? this['default']() : this['default'];
                } else {
                    throw new $$InvalidFieldConfigError(this.type, 'Invalid default value');
                }
            }
        }
    }, {
        key: 'validate',
        value: function validate(value) {

            // TODO is this necessary?
            // value = value || this.value;
            if (!value && !this.nullable) {
                return false;
            }
            if (typeof value === 'string' && (this.minLength && value.length < this.minLength || this.maxLength && value.length > this.maxLength)) {
                return false;
            } else if (this.minValue && value < this.minValue || this.maxValue && value > this.maxValue) {
                return false;
            }
            return true;
        }
    }]);

    return BaseField;
})();

var CharField = (function (_BaseField) {
    _inherits(CharField, _BaseField);

    function CharField() {
        _classCallCheck(this, CharField);

        _get(Object.getPrototypeOf(CharField.prototype), 'constructor', this).apply(this, arguments);
        this.type = 'CharField';
    }

    _createClass(CharField, [{
        key: 'create',
        value: function create() {
            _get(Object.getPrototypeOf(CharField.prototype), 'create', this).call(this);
            if (!this.value) {
                this.value = '';
            }
        }
    }, {
        key: 'validate',
        value: function validate(value) {
            value = this.value || value;
            if (typeof value !== 'string') {
                return false;
            }
            return _get(Object.getPrototypeOf(CharField.prototype), 'validate', this).call(this, value);
        }
    }]);

    return CharField;
})(BaseField);

var IntegerField = (function (_BaseField2) {
    _inherits(IntegerField, _BaseField2);

    function IntegerField() {
        _classCallCheck(this, IntegerField);

        _get(Object.getPrototypeOf(IntegerField.prototype), 'constructor', this).apply(this, arguments);
        this.type = 'IntegerField';
    }

    return IntegerField;
})(BaseField);

var KeyField = (function (_IntegerField) {
    _inherits(KeyField, _IntegerField);

    function KeyField() {
        _classCallCheck(this, KeyField);

        _get(Object.getPrototypeOf(KeyField.prototype), 'constructor', this).call(this, 1);
        this.type = 'KeyField';
        this.unique = false;
        this.minValue = 1;
        this.maxLength = 11;
        this.nullable = false;
    }

    return KeyField;
})(IntegerField);

var ForeignKeyField = (function (_KeyField) {
    _inherits(ForeignKeyField, _KeyField);

    function ForeignKeyField(rel, args) {
        _classCallCheck(this, ForeignKeyField);

        _get(Object.getPrototypeOf(ForeignKeyField.prototype), 'constructor', this).call(this, args);

        this.type = 'ForeignKeyField';

        if (!rel || !global.app.Models[rel]) {
            throw new $$InvalidFieldConfigError(this.type, 'Invalid relative model ' + (rel ? (0, _chalk.cyan)(rel) + ' ' : '') + 'in constrained field declaration');
        }

        this.nesting = this.deepNesting = false;
        if (args && typeof args === 'object') {

            if (args.hasOwnProperty('deepNesting')) {
                this.nesting = this.deepNesting = true;
            } else {
                this.nesting = args.hasOwnProperty('nesting');
            }
        }
        this.rel = rel;
        this.type = 'ForeignKeyField';
    }

    return ForeignKeyField;
})(KeyField);

var ManyToManyField = (function (_ForeignKeyField) {
    _inherits(ManyToManyField, _ForeignKeyField);

    function ManyToManyField(rel) {
        var args = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, ManyToManyField);

        _get(Object.getPrototypeOf(ManyToManyField.prototype), 'constructor', this).call(this, rel, args);

        this.type = 'ManyToManyField';
        this.unique = false;

        this.name = args.alias || args.name;
        if (!this.name) {
            throw new $$InvalidFieldConfigError(this.type, (0, _chalk.cyan)(this.type + 's') + ' require name to be included in ' + 'configuration and to be valid model');
        }

        // Setup a reference to the relationship model
        this.crossReferenceTableId = args.tableName || this.name + '_' + this.rel + '_id';
        if (!args.crossReferenceTable) {
            var _global$app$Model;

            global.app.Model(this.crossReferenceTableId, (_global$app$Model = {}, _defineProperty(_global$app$Model, this.name + '_id', new KeyField()), _defineProperty(_global$app$Model, this.rel + '_id', new KeyField()), _global$app$Model));
            this.crossReferenceTable = global.app.Models[this.crossReferenceTableId];
        } else {
            this.crossReferenceTableId = args.crossReferenceTableId;
            this.crossReferenceTable = args.crossReferenceTable;
        }
    }

    return ManyToManyField;
})(ForeignKeyField);

var $$InvalidFieldConfigError = (function (_TypeError) {
    _inherits($$InvalidFieldConfigError, _TypeError);

    function $$InvalidFieldConfigError(type) {
        var error = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

        _classCallCheck(this, $$InvalidFieldConfigError);

        _angieLog2['default'].error('Invalid Field configuration for ' + (0, _chalk.magenta)(type) + ('' + (error ? ': ' + error : '')));
        _get(Object.getPrototypeOf($$InvalidFieldConfigError.prototype), 'constructor', this).call(this);
        p.exit(1);
    }

    return $$InvalidFieldConfigError;
})(TypeError);

exports.CharField = CharField;
exports.IntegerField = IntegerField;
exports.ForeignKeyField = ForeignKeyField;
exports.ManyToManyField = ManyToManyField;