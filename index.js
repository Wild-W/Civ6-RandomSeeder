#!/usr/bin/env node
import { existsSync, writeFile, readFileSync } from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';

let lastPath = readFileSync('directory.txt', 'utf8');
let userChosenPath = lastPath;

async function askUsePath() {
    const answers = await inquirer.prompt({
        name: 'useDefault',
        type: 'list',
        message: 'Use directory ' + chalk.blueBright(lastPath) + '?',
        choices: [
            'Yes',
            'No',
        ],
    });

    if (answers.useDefault == 'Yes') {
        await pathExists(lastPath);
    } else {
        await askWhatPath();
    }
}

async function askWhatPath() {
    const answers = await inquirer.prompt({
        name: 'chosenPath',
        type: 'input',
        message: 'Input directory:'
    });

    userChosenPath = answers.chosenPath;
    await pathExists(userChosenPath);
}

async function pathExists(inputPath) {
    if (existsSync(inputPath)){
        console.log('Directory ' + inputPath + chalk.green(' found!'));
        if (existsSync(inputPath + '/CompletelyRandomTrees.modinfo')) {
            console.log('CompletelyRandomTrees.modinfo ' + chalk.green(' found!'));
            await seedingStart();
        } else {
            console.log('CompletelyRandomTrees.modinfo ' + chalk.red(' not found!'));
            await exitProcess();
        }
    } else {
        console.log('Directory ' + inputPath + chalk.red(' not found!'));
        await exitProcess();
    }
}

async function restartProcess() {
    console.log('Restart process reached');
}

async function exitProcess() {
    const answers = await inquirer.prompt({
        name: 'confirm',
        type: 'list',
        message: "Press 'Okay' to exit process",
        choices: [
            'Okay',
        ],
    });

    process.exit(0);
}

async function seedingStart() {
    const answers = await inquirer.prompt({
        name: 'seedingChoice',
        type: 'list',
        message: 'What is the desired operation?',
        choices: [
            'Generate new seed',
            'Import previous seed',
            'Import custom seed',
        ],
    });

    if (answers.seedingChoice == 'Generate new seed') {
        await writeRandomSeed();
    }
}

async function writeRandomSeed() {
    let GeneratedSeed = (Math.random()*10000000).toPrecision(7);
    writeFile('RandomSeed.sql', "INSERT OR IGNORE INTO GlobalParameters (Name, 'Value') VALUES ('CONFIG_TREES_RANDOM_SEED', " + GeneratedSeed + ");", function(err)
    {
        if (err)
            return console.log(err);
        console.log('Random seed ' + chalk.cyan(GeneratedSeed) + ' successfully wrote to RandomSeed.sql');
        exitProcess();
    });
}

//Start process
askUsePath();