#!/usr/bin/env node
import { writeFile } from 'fs';
import chalk from 'chalk';

let GeneratedSeed = (Math.random()*10000000).toPrecision(7);
writeFile('RandomSeed.sql', "INSERT OR IGNORE INTO GlobalParameters (Name, 'Value') VALUES ('CONFIG_TREES_RANDOM_SEED', " + GeneratedSeed + ");", function(err)
{
    if (err)
        return console.log(err);
    console.log('Random seed ' + chalk.cyan(GeneratedSeed) + ' successfully wrote to RandomSeed.sql');
});