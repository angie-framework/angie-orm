// 'use strict'; 'use strong';

// System Modules
import util from                'util';
import {magenta, cyan} from     'chalk';
import $LogProvider from        'angie-log';

// Angie ORM Modules
import {
    $$InvalidModelConfigError
} from                          '../util/$ExceptionsProvider';

const p = process;

class BaseField {
    constructor(
        args = 0,
        maxValue = undefined,
        minLength = 0,
        maxLength = undefined,
        nullable = false,
        unique = false,
        $default = undefined
    ) {
        this.type = 'BaseField';
        if (typeof args === 'object') {
            util._extend(this, arguments[0]);
        } else if (!isNaN(args)) {
            if (args === 1) {
                return;
            }
            [
                this.minValue,
                this.maxValue,
                this.minLength,
                this.maxLength,
                this.nullable,
                this.unique,
                this.default
            ] = [
                args,
                maxValue,
                minLength,
                maxLength,
                nullable,
                unique,
                $default
            ];
        }
    }
    create() {

        // TODO this method is not responsible for migrating a model, only
        // creating a field in a record when the model is instantiated
        if (
            this.default &&
            this.validate(this.default)
        ) {
            this.value = typeof this.default === 'function' ? this.default() :
                this.default;
        }
    }
    validate(value) {
        value = value || this.value;
        if (!value && !this.nullable) {
            return false;
        }
        if (typeof value === 'string') {
            if (
                (this.minLength && value.length <= this.minLength) ||
                (this.maxLength && value.length >= this.maxLength)
            ) {
                return false;
            }
            return true;
        } else {
            if (
                (this.minValue && value <= this.minValue) ||
                (this.maxValue && value >= this.maxValue)
            ) {
                return false;
            }
            return true;
        }
    }
}

class CharField extends BaseField {
    constructor() {
        super(...arguments);
        this.type = 'CharField';
    }
    create() {
        super.create();
        if (!this.value) {
            this.value = '';
        }
    }
    validate(value) {
        value = this.value || value;
        if (typeof value !== 'string') {
            return false;
        }
        return super.validate(value);
    }
}

class IntegerField extends BaseField {
    constructor() {
        super(...arguments);
        this.type = 'IntegerField';
    }
}

class ForeignKeyField extends BaseField {
    constructor(rel, args) {
        super(1);
        if (!rel) {
            $LogProvider.warn('Invalid relative field in constrained field');
            return;
        }

        this.nesting = true;
        this.deepNesting = false;
        if (args && typeof args === 'object') {
            this.nesting = args.hasOwnProperty('nesting') ? !!args.nesting : true;

            // TODO deep nesting
            this.deepNesting = args.hasOwnProperty('deepNesting') ?
                !!args.nesting : true;
        }
        this.rel = rel;
        this.type = 'ForeignKeyField';
    }
}

class ManyToManyField extends ForeignKeyField {
    constructor(rel, args = {}) {
        super(rel, args);

        this.type = 'ManyToManyField';
        this.name = args.alias || args.name;
        if (!this.name) {
            throw new $$InvalidFieldConfigError(
                this.type,
                `${cyan(`${this.type}s`)} require name or alias in their ` +
                `configuration`
            );
        }

        // TODO should be parent table id, sub parent table id
        this.crossReferenceTableId = args.tableName || `${this.name}_${this.rel}_id`;
        global.app.Model(this.crossReferenceTableId, {
            [ `${this.name}_id` ]: new IntegerField({
                unique: true,
                minValue: 1,
                maxLength: 11
            }),
            [ `${this.rel}_id` ]: new IntegerField({
                unique: true,
                minValue: 1,
                maxLength: 11
            })
        });

        // Setup a reference to the relationship model
        this.crossReferenceTable = global.app.Models[ this.crossReferenceTableId ];
    }
}

class $$InvalidFieldConfigError extends TypeError {
    constructor(type, error = '') {
        $LogProvider.error(
            `Invalid Field configuration for ${magenta(type)}` +
            `${error ? `: ${error}` : ''}`
        );
        super();
        p.exit(1);
    }
}

export {
    CharField,
    IntegerField,
    ForeignKeyField,
    ManyToManyField
};
