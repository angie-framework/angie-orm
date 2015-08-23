/**
 * @module $ExceptionsProvider.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 8/23/2015
 */

// System Modules
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _chalk = require('chalk');

var _angieLog = require('angie-log');

var _angieLog2 = _interopRequireDefault(_angieLog);

var p = process;

var $$InvalidConfigError = (function (_ReferenceError) {
    _inherits($$InvalidConfigError, _ReferenceError);

    function $$InvalidConfigError() {
        var name = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

        _classCallCheck(this, $$InvalidConfigError);

        _angieLog2['default'].error('Invalid' + (name ? ' ' + name : '') + ' configuration settings. ' + 'Please check your AngieFile.');
        _get(Object.getPrototypeOf($$InvalidConfigError.prototype), 'constructor', this).call(this);
    }

    return $$InvalidConfigError;
})(ReferenceError);

var $$InvalidDatabaseConfigError = (function (_$$InvalidConfigError) {
    _inherits($$InvalidDatabaseConfigError, _$$InvalidConfigError);

    function $$InvalidDatabaseConfigError() {
        _classCallCheck(this, $$InvalidDatabaseConfigError);

        _get(Object.getPrototypeOf($$InvalidDatabaseConfigError.prototype), 'constructor', this).call(this, 'database');
    }

    return $$InvalidDatabaseConfigError;
})($$InvalidConfigError);

var $$InvalidModelConfigError = (function (_TypeError) {
    _inherits($$InvalidModelConfigError, _TypeError);

    function $$InvalidModelConfigError(name) {
        var error = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

        _classCallCheck(this, $$InvalidModelConfigError);

        _angieLog2['default'].error('Invalid Model configuration for model ' + ((0, _chalk.magenta)(name) + ' <-- ' + (0, _chalk.magenta)(name) + (0, _chalk.magenta)('Provider')) + ('' + (error ? ' ' + error : '')));
        _get(Object.getPrototypeOf($$InvalidModelConfigError.prototype), 'constructor', this).call(this);
        p.exit(1);
    }

    return $$InvalidModelConfigError;
})(TypeError);

var $$InvalidModelReferenceError = (function (_Error) {
    _inherits($$InvalidModelReferenceError, _Error);

    function $$InvalidModelReferenceError() {
        _classCallCheck(this, $$InvalidModelReferenceError);

        _angieLog2['default'].error('Invalid Model argument');
        _get(Object.getPrototypeOf($$InvalidModelReferenceError.prototype), 'constructor', this).call(this);
        p.exit(1);
    }

    return $$InvalidModelReferenceError;
})(Error);

var $$InvalidModelFieldReferenceError = (function (_Error2) {
    _inherits($$InvalidModelFieldReferenceError, _Error2);

    function $$InvalidModelFieldReferenceError(name, field) {
        if (name === undefined) name = '';

        _classCallCheck(this, $$InvalidModelFieldReferenceError);

        _angieLog2['default'].error('Invalid param for Model ' + (0, _chalk.cyan)(name) + '.' + (0, _chalk.cyan)(field));
        _get(Object.getPrototypeOf($$InvalidModelFieldReferenceError.prototype), 'constructor', this).call(this);
        p.exit(1);
    }

    return $$InvalidModelFieldReferenceError;
})(Error);

exports.$$InvalidConfigError = $$InvalidConfigError;
exports.$$InvalidDatabaseConfigError = $$InvalidDatabaseConfigError;
exports.$$InvalidModelConfigError = $$InvalidModelConfigError;
exports.$$InvalidModelReferenceError = $$InvalidModelReferenceError;
exports.$$InvalidModelFieldReferenceError = $$InvalidModelFieldReferenceError;