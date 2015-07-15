'use strict'; 'use strong';

// System Modules
import fs from                          'fs';

// Angie ORM Modules
import SqliteConnection from            './SqliteConnection';
import MySqlConnection from             './MySqlConnection';
import {
    $$InvalidConfigError,
    $$InvalidDatabaseConfigError
} from                                  '../util/$ExceptionsProvider';

const p = process;
let app,
    dbs = {},
    config;

function AngieDatabaseRouter(args) {
    app = app || global.app;

    let database,
        name = 'default';

    if (!config && !global.app.$$config) {
        try {
            const $$config = JSON.parse(
                fs.readFileSync(`${process.cwd()}/AngieORMFile.json`)
            );

            if (typeof $$config === 'object') {
                global.app.$$config = $$config;
                Object.freeze(app.$$config);
            } else {
                throw new Error();
            }
        } catch(e) {
            throw new $$InvalidConfigError();
        }
    }
    config = global.app.$$config;

    if (args instanceof Array) {
        args.forEach(function(arg) {
            if (Object.keys(config.databases || {}).indexOf(args[1]) > -1) {
                name = arg;
            }
        });
    } else if (typeof args === 'string') {
        name = args;
    }

    // Check to see if the database is in memory
    database = dbs[ name ];
    if (database) {
        return database;
    }

    let db = config.databases ? config.databases[ name ] : undefined,
        destructive = !!p.argv.some((v) => /--destructive/i.test(v)),
        dryRun = !!p.argv.some((v) => /--dryrun/i.test(v));

    if (db && db.type) {
        let type = db.type;

        // TODO call these with the actual DB, we should not have to check
        // the config once it's in a bucket

        switch (type.toLowerCase()) {
            case 'mysql':
                database = new MySqlConnection(name, db, destructive, dryRun);
                break;

            // TODO add for Firebase controls
            // case 'firebase':
            //     database = new FirebaseConnection(db, destructive);
            //     break;
            default:
                database = new SqliteConnection(db, destructive, dryRun);
        }
    }

    if (!database) {
        throw new $$InvalidDatabaseConfigError();
    }

    // Setup a cache of database connections in memory already
    return (dbs[ name ] = database);
}

export default AngieDatabaseRouter;
