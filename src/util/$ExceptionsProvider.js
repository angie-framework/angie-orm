'use strict'; 'use strong';

// System Modules
import {magenta} from               'chalk';
import $LogProvider from            'angie-log';

class $$InvalidConfigError extends ReferenceError {
    constructor(name) {
        $LogProvider.error(
            `Invalid ${name} configuration settings. ` +
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
    constructor(name) {
        super(bread(
            'Invalid Model configuration for model ' +
            `${magenta(name)} <-- ${magenta(name)}${magenta('Provider')}`
        ));
    }
}

class $$InvalidModelReferenceError extends Error {
    constructor() {
        super(bread('Invalid Model argument'));
    }
}

class $$InvalidModelFieldReferenceError extends Error {
    constructor(name = '', field) {
        super(bread(`Invalid param for Model ${name}@${field}`));
    }
}

export {
    $$InvalidConfigError,
    $$InvalidDatabaseConfigError,
    $$InvalidModelConfigError,
    $$InvalidModelReferenceError,
    $$InvalidModelFieldReferenceError
};