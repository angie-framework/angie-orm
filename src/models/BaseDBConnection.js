'use strict'; 'use strong';

// System Modules
import util from                        'util';
import {cyan} from                      'chalk';
import $LogProvider from                'angie-log';

// Angie ORM Modules
import {AngieDBObject} from             './BaseModel';

import {
    $$InvalidModelReferenceError
} from                                  '../util/$ExceptionsProvider';

// Keys we do not necessarily want to parse as query arguments
const app = global.app,
      IGNORE_KEYS = [
          'database',
          'tail',
          'head',
          'rows',
          'values',
          'model'
      ];

/**
 * @desc BaseDBConnection is a private class which is not exposed to the Angie
 * provider. It contains all of the methods quintessential to making DB queries
 * regardless of DB vehicle. Some of the methods in this class are specific to
 * SQL type DBs and will need to be replaced when subclassed. This should be the
 * base class used for each DB type
 * @since 0.2.3
 * @access private
 */
class BaseDBConnection {

    /**
     * @param {object} database The database object to which the connection is
     * being made
     * @param {boolean} destructive Should destructive migrations be run?
     */
    constructor(database, destructive = false) {
        this.database = database;
        this.destructive = destructive;
    }
    name(modelName) {
        modelName = modelName.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (modelName.charAt(0) === '_') {
            modelName = modelName.slice(1, modelName.length);
        }
        return modelName;
    }
    models() {
        return this._models;
    }
    all(args = {}, fetchQuery = '', filterQuery = '') {
        if (!args.model || !args.model.name) {
            throw new $$InvalidModelReferenceError();
        }

        let values = '*';
        if (typeof args.values === 'object' && args.values.length) {
            values = args.values;
            if (values.indexOf('id') === -1) {
                values.unshift('id');
            }
        }
        return `SELECT ${values} FROM ${args.model.name} ` +
            `${filterQuery ? `WHERE ${filterQuery}` : ''} ${fetchQuery};`;
    }
    fetch(args = {}, filterQuery = '') {
        let ord = 'ASC';

        if (
            (args.head && args.head === false) ||
            (args.tail && args.tail === true)
        ) {
            ord = 'DESC';
        }

        const int = args.rows || 1,
              fetchQuery = `ORDER BY id ${ord} LIMIT ${int}`;
        return this.all(args, fetchQuery, filterQuery);
    }
    filter(args = {}) {
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
    $$filterQuery(args) {
        let filterQuery = [],
            fn = function(k, v) {

                // If there is a like operator, add a like phrase
                if (v.indexOf('~') > -1) {
                    return `${k} like '%${v.replace(/~/g, '')}%'`;
                } else if (
                    /(<=?|>=?)[^<>=]+/.test(v) &&
                    v.indexOf('>>') === -1 &&
                    v.indexOf('<<') === -1
                ) {

                    // If there is a condition, parse it, use as operator
                    // ^^ TODO there has to be a better way to do that condition
                    return v.replace(/(<=?|>=?)([^<>=]+)/, function(m, p, v) {
                        return `${k}${p}${!isNaN(v) ? v : `'${v}'` }`;
                    });
                }

                // Otherwise, return equality
                return `${k}='${v.replace(/[<>=]*/g, '')}'`;
            };
        for (let key in args) {
            if (IGNORE_KEYS.indexOf(key) > -1) {
                continue;
            }
            if (typeof args[ key ] !== 'object') {
                filterQuery.push(fn(key, args[ key ]));
            } else {
                filterQuery.push(`${key} in ${this.$$queryInString(args[ key ])}`);
            }
        }
        return filterQuery.length ? `${filterQuery.join(' AND ')}` : '';
    }
    create(args = {}) {
        let keys = Object.keys(args),
            queryKeys = [],
            values = [];

        if (!args.model || !args.model.name) {
            throw new $$InvalidModelReferenceError();
        }

        keys.forEach(function(key) {
            if (IGNORE_KEYS.indexOf(key) === -1) {
                queryKeys.push(key);
                values.push(`'${args[key]}'`);
            }
        });

        return `INSERT INTO ${args.model.name} (${queryKeys.join(', ')}) ` +
            `VALUES (${values.join(', ')});`;
    }
    delete(args = {}) {
        return `DELETE FROM ${args.model.name} ${this.$$filterQuery(args)};`;
    }
    update(args = {}) {
        if (!args.model || !args.model.name) {
            throw new $$InvalidModelReferenceError();
        }

        let filterQuery = this.$$filterQuery(args),
            idSet = this.$$queryInString(args.rows, 'id');
        if (!filterQuery) {
            $LogProvider.warn('No filter query in UPDATE statement.');
        } else {
            return `UPDATE ${args.model.name} SET ${filterQuery} WHERE id in ${idSet};`;
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
    $$queryInString(args = {}, key) {
        let fieldSet = [];
        if (key) {
            args.forEach(function(row) {
                fieldSet.push(`'${row[ key ]}'`);
            });
        } else if (args instanceof Array) {
            fieldSet = args.map((v) => `'${v}'`);
        }
        return `(${fieldSet.length ? fieldSet.join(',') : ''})`;
    }
    sync() {
        let me = this;

        // Every instance of sync needs a registry of the models, which implies
        return global.app.$$load().then(function() {
            console.log('in', global.app.Models);

            me._models = global.app.Models;
            $LogProvider.info(
                `Synccing database: ${cyan(me.database.name || me.database.alias)}`
            );
        });
    }
    migrate() {
        let me = this;

        // Every instance of sync needs a registry of the models, which implies
        return global.app.$$load().then(function() {
            me._models = global.app.Models;
            $LogProvider.info(
                `Migrating database: ${cyan(me.database.name || me.database.alias)}`
            );
        });
    }
    $$querySet(model, query, rows, errors) {
        let me = this,
            rels = [],
            relFieldNames = {},
            relArgs = {},

            proms = [];

        // We want to process all of the foreign keys
        rows.forEach(function(v) {

            // Find all of the foreign key fields
            for (let key in v) {
                const field = model[ key ];
                if (field && field.nesting === true) {
                    rels.push(field.rel);
                    relFieldNames[ field.rel ] = key;
                    relArgs[ field.rel ] = me.$$queryInString(rows, 'id');
                }
            }
        });

        console.log('ROWS', rows);

        // Instantiate a promise for each of the foreign key fields in the
        // query
        rels.forEach(function(v) {
            proms.push(me.filter({
                model: {
                    name: v,
                    id: relArgs[ v ]
                }
            }).then(function(queryset) {

                // Add errors to queryset errors
                if (errors === null) {
                    errors = [];
                }
                errors.push(queryset.errors);

                rows.forEach(function(row) {
                    queryset.forEach(function(queryRow) {
                        if (
                            !isNaN(+row[ relFieldNames[ v ] ]) &&
                            queryRow.hasOwnProperty('id') &&
                            row[ relFieldNames[ v ] ] === queryRow.id
                        ) {
                            row[ relFieldNames[ v ] ] = queryRow;
                        } else {
                            row[ relFieldNames[ v ] ] = null;
                        }
                    });
                });
            }));
        });

        return Promise.all(proms).then(function() {

            // Resolves to a value in the connections currently
            const queryset = new AngieDBObject(me, model, query);
            return util._extend(
                rows,
                { errors: errors },
                AngieDBObject.prototype,
                queryset
            );
        });
    }
}

class $$DatabaseConnectivityError extends Error {
    constructor(database) {
        let message;
        switch (database.type) {
            case 'mysql':
                message = 'Could not find MySql database ' +
                    `${cyan(database.name || database.alias)}@` +
                    `${database.host || '127.0.0.1'}:${database.port || 3306}`;
                break;
            default:
                message = `Could not find ${cyan(database.name)} in filesystem.`;
        }
        super($$err(message));
    }
}

export default BaseDBConnection;
export {$$DatabaseConnectivityError};
