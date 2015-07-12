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

let app,
    dbs = {},
    config;

function AngieDatabaseRouter(args) {
    app = app || global.app;

    let database,
        name = 'default';

    if (!config && !app.$$config) {
        try {
            const $$config = JSON.parse(
                fs.readFileSync(`${process.cwd()}/AngieORMFile.json`)
            );

            if (typeof $$config === 'object') {
                app.$$config = $$config;
                Object.freeze(app.$$config);
            } else {
                throw new Error();
            }
        } catch(e) {
            console.log(e);
            throw new $$InvalidConfigError();
        }
        config = app.$$config;
    }

    if (typeof args === 'object' && args.length) {
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
        console.log(database);
        return database;
    }

    let db = config.databases ? config.databases[ name ] : undefined,
        destructive = process.argv.indexOf('--destructive') > -1;

    if (db && db.type) {
        let type = db.type;

        // TODO call these with the actual DB, we should not have to check
        // the config once it's in a bucket

        switch (type.toLowerCase()) {
            case 'mysql':
                database = new MySqlConnection(name, db, destructive);
                break;

            // TODO add for Firebase controls
            // case 'firebase':
            //     database = new FirebaseConnection(db, destructive);
            //     break;
            default:
                database = new SqliteConnection(db, destructive);
        }
    }
    if (!database) {
        throw new $$InvalidDatabaseConfigError();
    }

    // Setup a cache of database connections in memory already
    return (dbs[ name ] = database);
}

export default AngieDatabaseRouter;
