'use strict'; 'use strong';

// System Modules
import mysql from                       'mysql';
import {cyan, magenta, gray} from       'chalk';
import $LogProvider from                'angie-log';

// Angie Modules
import BaseDBConnection, {
    $$DatabaseConnectivityError
} from                                  './BaseDBConnection';

// TODO import ORM Exceptions
import {
    $$InvalidDatabaseConfigError
} from                                  '../util/$ExceptionsProvider';



const p = process,
      DEFAULT_HOST = '127.0.0.1',
      DEFAULT_PORT = 3306;

export default class MySqlConnection extends BaseDBConnection {
    constructor(name, database, destructive, dryRun) {
        super(database, destructive);

        let db = this.database;

        if (!db.username) {
            throw new $$InvalidDatabaseConfigError(db);
        } else if (!this.connection) {
            this.connection = mysql.createConnection({
                host: db.host || DEFAULT_HOST,
                port: db.port || DEFAULT_PORT,
                user: db.username || '',
                password: db.password || '',
                database: name || db.name || db.alias
            });

            this.connection.on('error', function() {
                if (db.options && db.options.hardErrors) {
                    throw new $$InvalidDatabaseConfigError(db);
                }
            });
        }
    }
    types(field) {
        let type = field.type;
        if (!type) {
            return;
        }
        switch (type) {
            case 'CharField':
                return 'VARCHAR';

            // TODO support different size integers: TINY, SMALL, MEDIUM
            case 'IntegerField':
                return 'INTEGER';
            case 'ForeignKeyField':
                return `INTEGER, ADD CONSTRAINT FOREIGN KEY(${field.fieldname}) ` +
                    `REFERENCES ${field.rel}(id) ON DELETE CASCADE`;
            default:
                return undefined;
        }
    }
    connect() {
        let me = this;
        return new Promise(function() {
            me.connection.connect(arguments[0]);
        }).then(
            () => $LogProvider.info('Connection successful'),
            () => { throw new $$InvalidDatabaseConfigError(me.database) }
        );
    }
    disconnect() {
        return this.connection.end();
    }
    run(query, model) {
        let me = this,
            db = this.database,
            name = db.name || db.alias;
        return new Promise(function() {
            try {
                return me.connect().then(arguments[0]);
            } catch(e) {}
        }).then(function() {
            return new Promise(function(resolve) {
                $LogProvider.info(
                    `MySql Query: ${cyan(name)}: ${magenta(query)}`
                );
                return me.connection.query(query, function(e, rows = []) {
                    if (e) {
                        $LogProvider.warn(e);
                    }
                    resolve([ rows, e ]);
                });
            });
        }).then(function(args) {
            return me.$$querySet(model, query, args[0], args[1]);
        });
    }
    all() {
        const query = super.all.apply(this, arguments);
        return this.run(query, arguments[0].model);
    }
    create() {
        const query = super.create.apply(this, arguments);
        return this.run(query, arguments[0].model);
    }
    delete() {
        const query = super.delete.apply(this, arguments);
        return this.run(query, arguments[0].model);
    }
    update() {
        const query = super.update.apply(this, arguments);
        return this.run(query, arguments[0].model);
    }
    raw(query, model) {
        return this.run(query, model);
    }
    sync() {
        let me = this;

        // Don't worry about the error state, handled by connection
        return super.sync().then(() => me.connect().then(arguments[0]))
            .then(function() {

                let models = me.models(),
                    proms = [];

                for (let model in models) {

                    // Fetch models and get model name
                    let instance = models[ model ],
                        modelName = instance.name || instance.alias ||
                            me.name(model);

                    // Run a table creation with an ID for each table
                    proms.push(me.run(
                        `CREATE TABLE \`${modelName}\` ` +
                        '(`id` int(11) NOT NULL AUTO_INCREMENT, ' +
                        'PRIMARY KEY (`id`) ' +
                        ') ENGINE=InnoDB DEFAULT CHARSET=latin1;'
                    ));
                }
                return Promise.all(proms).then(function() {
                    return me.migrate();
                }).then(function() {
                    return me.disconnect();
                });
            });
    }
    migrate() {
        let me = this;
        return super.migrate().then(() => me.connect().then(arguments[0]))
            .then(function() {
                let models = me.models(),
                    proms = [];

                for (let model in models) {
                    const model = models[ key ],
                          modelName = me.name(model.name || model.alias),
                          fields = model.$fields();
                    let prom = me.run(
                        `SHOW COLUMNS from ${modelName};`
                    ).then(function(queryset) {
                        let proms = [];

                        queryset.forEach(function(v) {

                            // TODO check the value of v
                            if (
                                fields.indexOf(v) === -1 &&
                                me.destructive
                            ) {
                                let query =
                                    `ALTER TABLE ${modelName} DROP COLUMN ${v};`;
                                if (!me.dryRun) {
                                    proms.push(me.run(query));
                                } else {
                                    $LogProvider.info(
                                        `Dry Run Query: ${gray(query)}`
                                    );
                                }
                            }
                        });

                        fields.forEach(function(v) {
                            if (queryset.indexOf(v) === -1) {
                                let prom = me.run(
                                    `ALTER TABLE \`${modelName}\` ADD \`${v}\`
                                     ${me.types(model[ v ])} ` +
                                    (
                                        model[ v ].maxLength ?
                                        `(${model[ v ].maxLength})` : ''
                                    ) +
                                    `${model[ v ].constructor.name ===
                                        'ForeignKeyField' && model[ v ].nullable ? model[ v ] : ''}` +
                                    `${model[ v ].unique ? ' UNIQUE' : ''};`
                                );
                                proms.push(prom);
                            }
                        });
                        return Promise.all(proms);
                    });
                }
                return Promise.all(proms);
            }).then(p.exit.bind(null, 0));
    }
}
