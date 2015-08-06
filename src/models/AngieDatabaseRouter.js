'use strict'; 'use strong';

// System Modules
import fs from                          'fs';

// Angie ORM Modules
import SqliteConnection from            './SqliteConnection';
import MySqlConnection from             './MySqlConnection';
import FirebaseConnection from          './FirebaseConnection';
import MongoDBConnection from           './MongoDBConnection';
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
        for (let arg of args) {
            if (Object.keys(config.databases).indexOf(arg) > -1) {
                name = arg;
                break;
            }
        }
    } else if (typeof args === 'string') {
        name = args;
    }

    // Check to see if the database is in memory
    database = dbs[ name ];
    if (database) {
        return database;
    }

    let db = config.databases ? config.databases[ name ] : undefined,
        destructive = p.argv.some((v) => /--destructive/i.test(v)),
        dryRun = p.argv.some((v) => /--dry([-_])?run/i.test(v));

    if (db && db.type) {
        switch (db.type.toLowerCase()) {
            case 'mysql':
                database = new MySqlConnection(name, db, destructive, dryRun);
                break;
            case 'firebase':
                database = new FirebaseConnection(db, destructive, dryRun);
                break;
            default:
                database = new SqliteConnection(db, destructive, dryRun);
        }
    }

    console.log('DATABASE', database);

    if (!database) {
        console.log('HERE IS REALLY WHERE THE ERROR IS THROWN');
        throw new $$InvalidDatabaseConfigError();
    }

    // Setup a cache of database connections in memory already
    return (dbs[ name ] = database);
}

export default AngieDatabaseRouter;
