'use strict'; 'use strong';

// System Modules
import {red, bold, magenta} from 'chalk';

const bread = () => red(bold.apply(null, arguments));

class $$InvalidConfigError extends Error {
    constructor(name) {
        super(
            bread(
                `Invalid ${name} configuration settings. ` +
                'Please check your AngieFile.'
            )
        );
    }
}

class $$InvalidDatabaseConfigError extends $$InvalidConfigError {
    constructor() {
        super('database');
    }
}

class $$InvalidModelConfigError extends Error {
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