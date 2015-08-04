'use strict'; 'use strong';

// System Modules
import util from                        'util';

// Angie Modules
import AngieDatabaseRouter from         './AngieDatabaseRouter';
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
            const val = args[ field ] || null;
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

class AngieDBObject {
    constructor(database, model, query = '') {
        if (!database || !model) {
            return;
        }
        this.database = database;
        this.model = model;
        this.query = query;
    }
    first() {
        return this[0];
    }
    last() {
        return this.pop();
    }
    $$update(rows, args = {}) {

        // This should only be called internally, so it's not a huge hack:
        // rows either references the whole queryset or just a single row
        args.rows = rows instanceof Array ? rows : [ rows ];
        args.model = this.model;

        if (typeof args !== 'object') {
            return;
        }

        let updateObj = {};
        for (let key in args) {
            const val = args[ key ] || null;
            if (IGNORE_KEYS.indexOf(key) > -1) {
                continue;
            } else if (
                this.model[ key ] &&
                this.model[ key ].validate &&
                this.model[ key ].validate(val)
            ) {
                updateObj[ key ] = val;
            } else {
                throw new $$InvalidModelFieldReferenceError(this.model.name, key);
            }
        }

        util._extend(args, updateObj);
        return this.database.update(args);
    }
    $$addOrRemove(method, field, id, obj = {}, extra = {}) {
        switch (method) {
            case 'add':
                method = '$createUnlessExists';
                break;
            default: // 'remove'
                method = 'delete';
        }

        // Get database, other extra options
        obj = util._extend(obj, extra);

        // Check to see that there is an existing related object
        return global.app.Models[ field.rel ].exists(obj).then(function(v) {

            // Check to see if a reference already exists <->
            if (v) {
                let $obj = util._extend({
                    [ `${field.name}_id`]: id,
                    [ `${field.rel}_id` ]: obj.id
                }, extra);
                return field.crossReferenceTable[ method ]($obj);
            }
            throw new Error();
        }).catch(function() {
            throw new $$InvalidRelationCrossReferenceError(method, field, id, obj);
        });
    }
    $$readMethods(method, field, id, args = {}) {
        args = util._extend(args, {
            [ `${field.name}_id` ]: id,
            values: [ `${field.rel}_id` ]
        });
        method = [ 'filter', 'fetch' ].indexOf(method) > -1 ? method : 'filter';
        return field.crossReferenceTable[ method ](args);
    }
}

class $$InvalidRelationCrossReferenceError extends RangeError {
    constructor(method, field, id, obj, error = '') {
        $LogProvider.error(
            `Cannot ${method} reference on ${cyan(field.name)}: ` +
            'No such existing record.'
        );
        super();
        p.exit(1);
    }
}

export default BaseModel;
export {AngieDBObject};