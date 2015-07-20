'use strict'; 'use strong';

// Global Modules
import fs from                      'fs';
import {transform} from             'babel';

// System Modules
import {exec} from                  'child_process';
import util from                    'util';
import {gray, cyan} from            'chalk';
import {$injectionBinder} from      'angie-injector';
import $LogProvider from            'angie-log';

// Angie ORM Global Modules
import './Angie';

// Angie ORM Modules
import AngieDatabaseRouter from     './models/AngieDatabaseRouter';
import * as $$FieldProvider from    './models/$Fields';
import {
    $$InvalidModelConfigError
} from                              './util/$ExceptionsProvider';

// Tranform BabelJS options
transform('code', { stage: 0 });

const p = process;
let args = [];

// Remove trivial arguments
p.argv.forEach(function(v) {
    if (!v.match(/(node|iojs|index|help|angie(\-orm)?)/)) {
        args.push(v);
    } else if (v === 'help') {
        help();
    }
});

// Route the CLI request to a specific command if running from CLI
if (
    args.length &&
    args.some((v) => [ 'syncdb', 'migrate', 'test' ].indexOf(v) > -1)
) {
    switch ((args[0] || '').toLowerCase()) {
        case 'syncdb':
            AngieDatabaseRouter(args).sync();
            break;
        case 'migrate':
            AngieDatabaseRouter(args).migrate();
            break;
        default:
            runTests();
    }
}

function runTests() {

    // TODO is there any way to carry the stream output from gulp instead
    // of capturing stdout?
    exec(`cd ${__dirname} && gulp`, function(e, std, err) {
        $LogProvider.info(std);
        if (err) {
            $LogProvider.error(err);
        }
        if (e) {
            throw new Error(e);
        }
    });
}

function help() {
    $LogProvider.bold('Angie ORM');
    console.log('A flexible, Promise-based ORM for the Angie MVC');
    console.log('\r');
    $LogProvider.bold('Version:');
    console.log(global.ANGIE_ORM_VERSION);
    console.log('\r');
    $LogProvider.bold('Commands:');
    console.log(
        'syncdb [ database ]                                                   ' +
        gray(
            'Sync the current specified databases in the AngieFile. ' +
            'Defaults to the default created database'
        )
    );
    console.log(
        'migrations [ --destructive -- optional ] [ --dryrun -- optional ]     ' +
        gray(
            'Checks to see if the database and the specified ' +
            'models are out of sync. Generates NO files.'
        )
    );
    console.log(
        'test                                                                  ' +
        gray(
            'Runs the Angie test suite and prints the results in the ' +
            'console'
        )
    );
    p.exit(0);
}

export {$$FieldProvider as $$Fields};