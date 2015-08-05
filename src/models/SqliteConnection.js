'use strict'; 'use strong';

// System Modules
import fs from                          'fs';
import sqlite3 from                     'sqlite3';
import {cyan, magenta, gray} from       'chalk';
import $LogProvider from                'angie-log';

// Angie Modules
import BaseDBConnection, {
    $$DatabaseConnectivityError
} from                                  './BaseDBConnection';
import {
    $$InvalidDatabaseConfigError
} from                                  '../util/$ExceptionsProvider';

sqlite3.verbose();

const p = process;
$LogProvider.sqliteInfo = $LogProvider.info.bind(null, 'Sqlite');

export default class SqliteConnection extends BaseDBConnection {
    constructor(database, destructive, dryRun) {
        super(database, destructive, dryRun);

        let db = this.database;
        if (!db.name) {
            throw new $$InvalidDatabaseConfigError();
        }
        this.name = this.database.name || this.database.alias;
    }
    types(field) {
        let type = field.type;
        if (!type) {
            return;
        }
        switch (type) {
            case 'CharField':
                return 'TEXT';

            // TODO support different size integers: TINY, SMALL, MEDIUM
            case 'IntegerField':
                return 'INTEGER';
            case 'KeyField':
                return 'INTEGER';
            case 'ForeignKeyField':
                return `INTEGER REFERENCES ${field.rel}(id)`;
            default:
                return undefined;
        }
    }
    connect() {
        let db = this.database;
        if (!this.connection) {
            try {
                this.connection = new sqlite3.Database(this.name);
                $LogProvider.sqliteInfo('Connection successful');
            } catch(err) {
                throw new $$DatabaseConnectivityError(db);
            }
        }
        return this.connection;
    }
    serialize(fn) {
        return this.connect().serialize(fn);
    }
    disconnect() {
        this.connect().close();
        return this;
    }
    query(query, model, key) {
        let me = this,
            db = this.database,
            name = this.name;
        return new Promise(function(resolve) {
            return me.serialize(resolve);
        }).then(function() {
            return new Promise(function(resolve) {
                $LogProvider.sqliteInfo(`Query: ${cyan(name)}: ${magenta(query)}`);
                return me.connection[ key ](query, function(e, rows = []) {
                    if (e) {
                        $LogProvider.warn(e);
                    }
                    resolve([ rows, e ]);
                });
            });
        }).then(function(args) {
            return me.$$queryset(model, query, args[0], args[1]);
        });
    }
    run(query, model) {
        return this.query(query, model, 'run');
    }
    all() {
        const query = super.all.apply(this, arguments);
        return this.query(query, arguments[0].model, 'all');
    }
    create() {
        const query = super.create.apply(this, arguments);
        return this.query(query, arguments[0].model, 'all');
    }
    delete() {
        const query = super.delete.apply(this, arguments);
        return this.query(query, arguments[0].model,  'all');
    }
    update() {
        const query = super.update.apply(this, arguments);
        return this.query(query, arguments[0].model,  'all');
    }
    raw(query, model) {
        return this.query(query, model, 'all');
    }
    sync() {
        let me = this;
        super.sync().then(function() {
            let proms = [];

            // TODO test this in another directory
            if (!fs.existsSync(me.name)) {

                // Connection does not exist and we must touch the db file
                fs.closeSync(fs.openSync(me.name, 'w'));
            }

            let models = me.models();
            for (let model in models) {

                // Fetch models and get model name
                let instance = models[ model ],
                    modelName = instance.name || instance.alias ||
                        me.$$name(instance);

                // Run a table creation with an ID for each table
                proms.push(me.run(
                    `CREATE TABLE ${modelName} ` +
                    '(id INTEGER PRIMARY KEY AUTOINCREMENT);',
                    modelName
                ));
            }
            return Promise.all(proms).then(function() {
                return me.migrate();
            });
        });
    }
    migrate() {
        let me = this;
        return super.migrate().then(function() {
            let models = me.models(),
                proms = [],
                logged = true;

            for (let key in models) {
                const model = models[ key ],
                      modelName = me.$$name(model.name || model.alias),
                      fields = model.$fields();
                if (me.destructive && logged) {

                    // TODO recommmend that the user copy the table over
                    // without the column, delete the original, and
                    // rename the table
                    $LogProvider.error(
                        'You have specified a destructive Migration and ' +
                        `have fields in the ${cyan(modelName)} model ` +
                        'which do not exist in your app.Model code. ' +
                        'However, sqlite3 destructive migrations are not ' +
                        'supported. Please see the docs for more info.'
                    );
                    logged = false;
                }

                fields.forEach(function(v) {
                    if (model[ v ].type === 'ManyToManyField') {
                        return;
                    }

                    let query,
                        $default;
                    if (model[ v ].default) {
                        $default = model[ v ].default;
                        if (typeof $default === 'function') {
                            $default = $default();
                        }
                    }
                    query =
                        `ALTER TABLE ${modelName} ADD COLUMN ${v} ` +
                        `${me.types(model[ v ])}` +
                        `${model[ v ].nullable ? ' NOT NULL' : ''}` +
                        `${model[ v ].unique ? ' UNIQUE' : ''}` +
                        `${$default ? ` DEFAULT '${$default}'` : ''};`
                    if (!me.dryRun) {
                        proms.push(me.run(query));
                    } else {
                        $LogProvider.sqliteInfo(`Dry Run Query: ${gray(query)}`);
                    }
                });
            }
            return Promise.all(proms);
        }).then(function() {
            me.disconnect();
            $LogProvider.sqliteInfo(
                `Successfully Synced & Migrated ${cyan(me.name)}`
            );
            p.exit(0);
        });
    }
}
