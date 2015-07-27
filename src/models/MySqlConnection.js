'use strict'; 'use strong';

// System Modules
import mysql from                       'mysql';
import {cyan, magenta, gray} from       'chalk';
import $LogProvider from                'angie-log';

// Angie Modules
import BaseDBConnection, {
    $$DatabaseConnectivityError
} from                                  './BaseDBConnection';
import {
    $$InvalidDatabaseConfigError
} from                                  '../util/$ExceptionsProvider';

const p = process,
      DEFAULT_HOST = '127.0.0.1',
      DEFAULT_PORT = 3306;
$LogProvider.mysqlInfo = $LogProvider.info.bind(null, 'MySQL');

export default class MySqlConnection extends BaseDBConnection {
    constructor(name, database, destructive, dryRun) {
        super(database, destructive, dryRun);
        let db = this.database;

        if (!db.username) {
            throw new $$InvalidDatabaseConfigError(db);
        } else if (!this.connection) {
            this.name = name || this.database.name || this.database.alias;
            this.connection = mysql.createConnection({
                host: db.host || DEFAULT_HOST,
                port: db.port || DEFAULT_PORT,
                user: db.username || '',
                password: db.password || '',
                database: this.name
            });

            this.connection.on('error', function() {
                if (db.options && db.options.hardErrors) {
                    throw new $$InvalidDatabaseConfigError(db);
                }
            });

            this.connected = false;
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
            case 'KeyField':
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
        return new Promise(function(resolve) {
            console.log('in connect');
            if (me.connected === false) {
                console.log('connecting');
                me.connection.connect(function(e) {

                    // TODO add this back in?
                    // if (e) {
                    //     throw new $$DatabaseConnectivityError(me.database);
                    // }
                    me.connected = true;
                    console.log('connected');
                    $LogProvider.mysqlInfo('Connection successful');
                });
            }
            console.log('RESOLVED');
            resolve();
        });
    }
    disconnect() {
        this.connection.end();
        this.connected = false;
    }
    run(query, model) {
        console.log('in run', model, query);
        let me = this,
            db = this.database,
            name = this.name;
        return this.connect().then(function() {
            console.log('DO I GET HERE');
            return new Promise(function(resolve) {
                $LogProvider.mysqlInfo(
                    `Query: ${cyan(name)}: ${magenta(query)}`
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
        }).catch(function(e) {
            console.log(e);
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
        return super.sync().then(function() {
            let models = me.models(),
                proms = [];

            for (let model in models) {

                // Fetch models and get model name
                let instance = models[ model ],
                    modelName = instance.name || instance.alias ||
                        me.$$name(model);

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
            });
        });
    }
    migrate() {
        let me = this;
        return super.migrate().then(function() {
            return me.run('SHOW TABLES').then((queryset) => queryset);
        }).then(function(queryset) {
            const modelMap = [
                for (model of queryset) model[ `Tables_in_${me.name}` ]
            ];
            let models = me.models(),
                proms = [];
            for (let key of modelMap) {
                let prom;
                if (!models.hasOwnProperty(key)) {

                    // Don't consolidate, we don't want to look at the fields
                    if (me.destructive) {
                        prom = me.run(`DROP TABLE \`${key}\`;`);
                    }
                } else {
                    const model = models[ key ],
                          modelName = me.$$name(model.name || model.alias),
                          fields = model.$fields();
                    prom = me.run(
                        `SHOW COLUMNS from \`${modelName}\`;`,
                        modelName
                    ).then(function(queryset) {
                        let proms = [];
                        queryset.forEach(function(v) {
                            if (
                                fields.indexOf(v.Field) === -1 &&
                                v.Field !== 'id' &&
                                me.destructive
                            ) {
                                let query =
                                    `ALTER TABLE \`${modelName}\` DROP COLUMN \`${v.Field}\`;`;
                                if (!me.dryRun) {
                                    proms.push(me.run(query));
                                } else {
                                    $LogProvider.mysqlInfo(
                                        `Dry Run Query: ${gray(query)}`
                                    );
                                }
                            }
                        });

                        // TODO you've got to return if many to many here
                        fields.forEach(function(v) {
                            if (model[ v ].type === 'ManyToManyField') {
                                return;
                            }
                            if (queryset.map(($v) => $v.Field).indexOf(v) === -1) {
                                let query,
                                    $default;
                                if (model[ v ].default) {
                                    $default = model[ v ].default;
                                    if (typeof $default === 'function') {
                                        $default = $default();
                                    }
                                }
                                query =
                                    `ALTER TABLE \`${modelName}\` ADD COLUMN \`${v}\` ` +
                                    `${me.types(model[ v ])}(` +
                                    (
                                        model[ v ].maxLength ?
                                        `${model[ v ].maxLength}` : '255'
                                    ) +
                                    `)${model[ v ].constructor.name ===
                                        'ForeignKeyField' && model[ v ].nullable ? '' :
                                        ' NOT NULL'}` +
                                    `${model[ v ].unique ? ' UNIQUE' : ''}` +
                                    `${$default ? ` DEFAULT '${$default}'` : ''};`
                                if (!me.dryRun) {
                                    proms.push(me.run(query));
                                } else {
                                    $LogProvider.mysqlInfo(
                                        `Dry Run Query: ${gray(query)}`
                                    );
                                }
                            }
                        });
                        return Promise.all(proms);
                    });
                }
                proms.push(prom);
            }
            return Promise.all(proms);
        }).then(function() {
            me.disconnect();
            $LogProvider.mysqlInfo(
                `Successfully Synced & Migrated ${cyan(me.name)}`
            );
            p.exit(0);
        }).catch(function(e) {
            console.log(e);
        })
    }
}
