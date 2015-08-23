/**
 * @module FirebaseConnection.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 8/23/2015
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FirebaseConnection = function FirebaseConnection() {
  _classCallCheck(this, FirebaseConnection);
};

exports["default"] = FirebaseConnection;

// TODO security around this connection

// Firebase is a little different
// The data is basically just kvps
// We need to create one big list per model
module.exports = exports["default"];