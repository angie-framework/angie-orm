/**
 * @module decorators.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 8/23/2015
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
function Base(name) {
  return function (obj) {
    global.app[name](obj.prototype.constructor.name, obj);
  };
}

var Model = Base('Model');

exports.Model = Model;