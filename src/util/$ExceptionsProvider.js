'use strict'; 'use strong';

// System Modules
import {red, bold} from 'chalk';

export class $$InvalidConfigError extends Error {
    constructor(name) {
        super(
            $$err(
                `Invalid ${database} configuration settings. ` +
                'Please check your AngieFile.'
            )
        );
    }
}

export class $$InvalidDatabaseConfigError extends $$InvalidConfigError {
    constructor() {
        super('database');
    }
}

export class $$InvalidModelConfigError extends Error {
    constructor(name) {
        super($$err(
            `Invalid Model configuration for model ${name} <-- ${name}Provider`
        ));
    }
}

export class $$InvalidModelReferenceError extends Error {
    constructor() {
        super($$err('Invalid Model argument'));
    }
}

export class $$InvalidModelFieldReferenceError extends Error {
    constructor(name = '', field) {
        super($$err(`Invalid param for Model ${name}@${field}`));
    }
}

function $$err() {
    return red(bold.apply(null, arguments));
}