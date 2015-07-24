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
    'save',
    'rows'
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
        console.log('ARGS', args);

        args.model = this;

        // Returns a filtered subset of rows
        return this.$$prep.apply(
            this,
            arguments
        ).filter(args);
    }
    exists() {
        return this.filter.apply(this, arguments).then(function(querySet) {
            return !!querySet.length;
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
                throw new $$InvalidModelFieldReference(me.name, field);
            }
        });

        // Once that is settled, we can call our create
        return this.database.create(args);
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
        console.log('AngieDBObject', AngieDBObject);
        this.$$database = AngieDatabaseRouter(
            database || this.database || 'default'
        );
        console.log('RESOLVED', this.$$database.filter);
        return this.$$database;
    }
}

// "DO YOU WANT TO CHAIN!? BECAUSE THIS IS HOW YOU CHAIN!"
// TODO this can be made much better once Promise is subclassable
// let AngieDBObject = function(database, model, query = '') {
//     if (!database || !model) {
//         return;
//     }
//     this.database = database;
//     this.model = model;
//     this.query = query;
// };
//
// AngieDBObject.prototype.update = function(args = {}) {
//     args.model = this.model;
//     args.rows = this;
//     if (typeof args !== 'object') {
//         return;
//     }
//
//     let updateObj = {};
//     for (let key in args) {
//         const val = args[ key ] || null;
//         if (IGNORE_KEYS.indexOf(key) > -1) {
//             continue;
//         } else if (
//             this[ key ] &&
//             this[ key ].validate &&
//             this[ key ].validate(val)
//         ) {
//             updateObj[ key ] = val;
//         } else {
//             throw new $$InvalidModelFieldReferenceError(this.name, key);
//         }
//     }
//
//     util._extend(args, updateObj);
//     return this.database.update(args);
// };

// TODO update the AngieDBObject to make it a sugared class
// TODO make a double private method called $$add -> or just have the class itself
// inherit from the many to many Field
// for each row you need to add a way to grab all of the many to many REFERENCES
// delete and add references

class AngieDBObject {
    constructor(database, model, query = '') {
        if (!database || !model) {
            return;
        }
        this.database = database;
        this.model = model;
        this.query = query;
    }
    update(args = {}) {
        args.model = this.model;
        args.rows = this;
        if (typeof args !== 'object') {
            return;
        }

        let updateObj = {};
        for (let key in args) {
            const val = args[ key ] || null;
            if (IGNORE_KEYS.indexOf(key) > -1) {
                continue;
            } else if (
                this[ key ] &&
                this[ key ].validate &&
                this[ key ].validate(val)
            ) {
                updateObj[ key ] = val;
            } else {
                throw new $$InvalidModelFieldReferenceError(this.name, key);
            }
        }

        util._extend(args, updateObj);
        return this.database.update(args);
    }
    first() {
        return this[0];
    }
    last() {
        return this.pop();
    }
    $$addOrRemove(method, field, id, obj) {
        return field.crossReferenceTable[ method ]({
            [ `${field.name}_id`]: id,
            [ `${field.rel}_id` ]: obj.id
        });
    }
    $$readMethods(method, field, id, args) {
        args.id = id;

        method = [ 'filter', 'fetch' ].indexOf(method) > -1 ? method : 'filter';
        console.log('METHOD', field.crossReferenceTable.filter);
        return field.crossReferenceTable[ method ](args);
    }
}

// TODO update references to base model for default export
export default BaseModel;
export {
    BaseModel,
    AngieDBObject
};
