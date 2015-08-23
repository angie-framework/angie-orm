/**
 * @module $ExceptionsProvider.js
 * @author Joe Groseclose <@benderTheCrime>
 * @date 8/23/2015
 */

// System Modules
import {magenta, cyan} from         'chalk';
import $LogProvider from            'angie-log';

const p = process;

class $$InvalidConfigError extends ReferenceError {
    constructor(name = '') {
        $LogProvider.error(
            `Invalid${name ? ` ${name}` : ''} configuration settings. ` +
            'Please check your AngieFile.'
        );
        super();
    }
}

class $$InvalidDatabaseConfigError extends $$InvalidConfigError {
    constructor() {
        super('database');
    }
}

class $$InvalidModelConfigError extends TypeError {
    constructor(name, error = '') {
        $LogProvider.error(
            'Invalid Model configuration for model ' +
            `${magenta(name)} <-- ${magenta(name)}${magenta('Provider')}` +
            `${error ? ` ${error}` : ''}`
        );
        super();
        p.exit(1);
    }
}

class $$InvalidModelReferenceError extends Error {
    constructor() {
        $LogProvider.error('Invalid Model argument');
        super();
        p.exit(1);
    }
}

class $$InvalidModelFieldReferenceError extends Error {
    constructor(name = '', field) {
        $LogProvider.error(
            `Invalid param for Model ${cyan(name)}.${cyan(field)}`
        );
        super();
        p.exit(1);
    }
}

export {
    $$InvalidConfigError,
    $$InvalidDatabaseConfigError,
    $$InvalidModelConfigError,
    $$InvalidModelReferenceError,
    $$InvalidModelFieldReferenceError
};