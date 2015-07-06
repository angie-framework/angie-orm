'use strict'; 'use strong';

// System Modules
import chalk from 'chalk';

class $$ExceptionsProvider {
    static $$databaseConnectivityError(database) {
        let message;
        switch (database.type) {
            case 'mysql':
                message = `Could not find MySql database ${database.name || database.alias}@` +
                    `${database.host || '127.0.0.1'}:${database.port || 3306}`;
                break;
            default:
                message = `Could not find ${database.name} in filesystem.`;
        }
        throw new Error($$err(message));
    }
    static $$databaseTableExists(e) {
        throw new Error($$err(e));
    }
    static $$invalidDatabaseConfig() {
        return this.$$invalidConfig('database');
    }
    static $$invalidModelReference() {
        throw new Error(
            $$err(`Invalid Model argument`)
        );
    }
    static $$invalidModelFieldReference(name = '', field) {
        throw new Error(
            $$err(`Invalid param for Model ${name}@${field}`)
        );
    }
}

export class $$InvalidModelConfig extends Error {
    constructor(name) {
        super($$err(
            `Invalid Model configuration for model ${name} <-- ${name}Provider`
        ));
    }
}

function $$err() {
    return chalk.red(chalk.bold.apply(null, arguments));
}