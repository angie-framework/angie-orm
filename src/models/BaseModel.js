/**
 * @module BaseModel.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 8/23/2015
 */

// System Modules
import {cyan} from                      'chalk';
import $LogProvider from                'angie-log';

// Angie Modules
import AngieDatabaseRouter from         '../databases/AngieDatabaseRouter';
import {
    $$InvalidModelFieldReferenceError
} from                                  '../util/$ExceptionsProvider';

const IGNORE_KEYS = [
    'database',
    '$$database',
    'model',
    'name',
    'fields',
    'rows',
    'update',
    'first',
    'last'
];

class BaseModel {
    constructor(name) {
        this.name = this.name || name;
    }
    all(args = {}) {
        args.model = this;

        // Returns all of the rows
        return this.$$prep.apply(this, arguments).all(args);
    }
    fetch(args = {}) {
        args.model = this;

        // Returns a subset of rows specified with an int and a head/tail argument
        return this.$$prep.apply(
            this,
            arguments
        ).fetch(args);
    }
    filter(args = {}) {
        args.model = this;

        // Returns a filtered subset of rows
        return this.$$prep.apply(
            this,
            arguments
        ).filter(args);
    }
    exists(args = {}) {
        args.model = args.model || this;
        return this.filter.apply(this, arguments).then(function(queryset) {
            return !!queryset[0];
        });
    }
    create(args = {}) {
        args.model = this;

        this.database = this.$$prep.apply(this, arguments);

        // Make sure all of our fields are resolved
        let createObj = {},
            me = this;

        this.$fields().forEach(function(field) {
            let val = args[ field ] || args.model[ field ].default || null;
            if (typeof val === 'function') {
                val = val.call(this, args);
            }
            if (
                me[ field ] &&
                me[ field ].validate &&
                me[ field ].validate(val)
            ) {
                createObj[ field ] = val;
            } else {
                throw new $$InvalidModelFieldReferenceError(me.name, field);
            }
        });

        // Once that is settled, we can call our create
        return this.database.create(args);
    }
    $createUnlessExists(args = {}) {
        args.model = this;

        // Check to see if a matching record exists and if not create it
        let me = this;
        return this.exists(args).then((v) =>
            me[ v ? 'fetch' : 'create' ](args)
        );
    }
    delete(args = {}) {
        args.model = this;

        // Delete a record/set of records
        return this.$$prep.apply(
            this,
            arguments
        ).delete(args);
    }
    query(query, args = {}) {
        if (typeof query !== 'string') {
            return new Promise(function() {
                arguments[1](new Error('Invalid Query String'));
            });
        }
        return this.$$prep.apply(this, args).raw(query, this);
    }
    $fields() {
        this.fields = [];
        for (let key in this) {
            if (
                typeof this[ key ] === 'object' &&
                IGNORE_KEYS.indexOf(key) === -1
            ) {
                this.fields.push(key);
            }
        }
        return this.fields;
    }
    $$prep(args = {}) {
        const database = typeof args === 'object' && args.hasOwnProperty('database') ?
                  args.database : null;

        // This forces the router to use a specific database, DB can also be
        // forced at a model level by using this.database
        this.$$database = AngieDatabaseRouter(
            database || this.database || 'default'
        );
        return this.$$database;
    }
}

class $$InvalidRelationCrossReferenceError extends RangeError {
    constructor(method, field) {
        $LogProvider.error(
            `Cannot ${method} reference on ${cyan(field.name)}: ` +
            'No such existing record.'
        );
        super();
    }
}

export default BaseModel;