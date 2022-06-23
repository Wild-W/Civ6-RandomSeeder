#!/usr/bin/env node
import { existsSync, writeFile, readFileSync, appendFile } from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';

let lastPath = readFileSync('directory.txt', 'utf8');
let userChosenPath = lastPath;

async function askUsePath() {
    const answers = await inquirer.prompt({
        name: 'useDefault',
        type: 'list',
        message: 'Use directory ' + chalk.cyanBright(lastPath) + '?',
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
            writeFile('directory.txt', userChosenPath, function(err)
            {
                if (err)
                    return console.log(err);
                console.log('Directory.txt updated with chosen path');
                seedingStart();
            });
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
            'Load previous seed',
            'Import custom seed',
        ],
    });

    if (answers.seedingChoice == 'Generate new seed') {
        await writeSeed((Math.random()*10000000).toPrecision(7), 'random');
    } else if (answers.seedingChoice == 'Load previous seed') {
        console.log('got to load previous seed');
    } else if (answers.seedingChoice == 'Import custom seed') {
        const subAnswers = await inquirer.prompt({
            name: 'chosenSeed',
            type: 'input',
            message: 'Input seed:',
        });
        await writeSeed(subAnswers.chosenSeed, 'new');
    }
}

async function writeSeed(inputSeed, seedType) {
    writeFile('RandomSeed.sql', "INSERT OR IGNORE INTO GlobalParameters (Name, 'Value') VALUES ('CONFIG_TREES_RANDOM_SEED', " + inputSeed + ");", function(err)
    {
        if (err)
            return console.log(err);
        if (seedType == 'random') {
            console.log('Random seed ' + chalk.cyan(inputSeed) + ' successfully wrote to RandomSeed.sql');
            newProfile(inputSeed);
        } else {
            console.log('Chosen seed ' + chalk.cyan(inputSeed) + ' successfully wrote to RandomSeed.sql');
            if (seedType == 'new') {
                newProfile(inputSeed);
                return;
            } else if (seedType == 'load') {
                exitProcess();
            }
        }
    });
}

async function newProfile(inputSeed) {
    const answers = await inquirer.prompt({
        name: 'makeProfile',
        type: 'list',
        message: 'Make a new profile?',
        choices: [
            'Yes',
            'No',
        ],
    });

    if (answers.makeProfile == 'Yes') {
        createProfile(inputSeed);
    } else {
        exitProcess();
    }
}

async function createProfile(inputSeed) {
    const answers = await inquirer.prompt({
        name: 'profileName',
        type: 'input',
        message: 'Input a name:',
    });

    //Check if name consists of nothing or only white space
    if (answers.profileName.trim().length === 0) {
        console.log('Profile name cannot be nothing!');
        redoProfile(inputSeed);
    } else {
        appendFile('profiles.txt', '\n' + answers.profileName + ': ' + inputSeed, function(err){
            if (err)
                return console.log(err);
        });

        console.log('New profile ' + chalk.cyan(answers.profileName) + ' created with seed ' + chalk.cyan(inputSeed) + '!');
        await exitProcess();
    }
}

function redoProfile(inputSeed) {
    createProfile(inputSeed);
}

//Start process
askUsePath();