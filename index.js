#!/usr/bin/env node
import { existsSync, writeFile, readFileSync, appendFile } from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import clipboard from 'clipboardy';

//Utility function
function isNumber(val) {
    return /^\d+$/.test(val);
}

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
        console.log('Directory ' + inputPath + chalk.greenBright(' found!'));
        if (existsSync(inputPath + '/CompletelyRandomTrees.modinfo')) {
            console.log('CompletelyRandomTrees.modinfo' + chalk.greenBright(' found!'));
            writeFile('directory.txt', userChosenPath, function(err)
            {
                if (err)
                    return console.log(err);
                console.log('Directory.txt updated with chosen path');
                seedingStart();
            });
        } else {
            console.log('CompletelyRandomTrees.modinfo ' + chalk.red(' not found!'));
            await restartProcess();
        }
    } else {
        console.log('Directory ' + inputPath + chalk.red(' not found!'));
        await restartProcess();
    }
}

async function restartProcess() {
    const answers = await inquirer.prompt({
        name: 'retry',
        type: 'list',
        message: "Retry?",
        choices: [
            'Yes',
            'No',
        ],
    });

    if (answers.retry == 'Yes') {
        askUsePath();
    } else {
        exitProcess();
    }
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
            'Choose another random solution',
        ],
    });

    if (answers.seedingChoice == 'Generate new seed') {
        let generatedSeed = Math.floor(Math.random() * 10000000);
        const subAnswers = await inquirer.prompt({
            name: 'modifyMod',
            type: 'list',
            message: 'Write seed '  + chalk.cyanBright(generatedSeed) + ' to mod?' ,
            choices: [
                'Yes',
                'No',
            ],
        });

        if (subAnswers.modifyMod == 'Yes') {
            await writeSeed(generatedSeed, 'random');
        } else {
            await seedClipboard(generatedSeed);
        }
    } else if (answers.seedingChoice == 'Load previous seed') {
        console.log('got to load previous seed');
    } else if (answers.seedingChoice == 'Import custom seed') {
        const subAnswers = await inquirer.prompt({
            name: 'chosenSeed',
            type: 'number',
            message: 'Input seed:',
        });

        if (isNumber(subAnswers.chosenSeed)){
            await writeSeed(subAnswers.chosenSeed, 'new');
        } else {
            console.log('Seed can only contain numbers!');
            seedingStart.call(this);
        }
    } else if (answers.seedingChoice == 'Choose another random solution') {
        await otherSolutions();
    }
}

async function otherSolutions() {
    const answers = await inquirer.prompt({
        name: 'chosenSolution',
        type: 'list',
        message: 'Choose another random solution',
        choices: [
            'New seed every day',
            'New seed every minute',
            'SQLite random function (does not work in multiplayer, new seed every reload)',
        ],
    });

    if (answers.chosenSolution == 'New seed every day') {
        await writeSeed("STRFTIME('%Y%m%d')", 'day');
    } else if (answers.chosenSolution == 'New seed every minute') {
        await writeSeed("STRFTIME('%d%H%M')", 'minute');
    } else if (answers.chosenSolution == 'SQLite random() function (does not work in multiplayer, new seed every reload)') {
        await writeSeed('Abs(Random() % 10000000)', 'randomFunc');
    }
}

async function writeSeed(inputSeed, seedType) {
    writeFile('RandomSeed.sql', "INSERT OR IGNORE INTO GlobalParameters (Name, 'Value') VALUES ('CONFIG_TREES_RANDOM_SEED', " + inputSeed + ");", function(err)
    {
        if (err)
            return console.log(err);
        if (seedType == 'random') {
            console.log('Random seed ' + chalk.cyanBright(inputSeed) + ' successfully wrote to ' +  chalk.yellowBright('RandomSeed.sql') + '!');
            seedClipboard(inputSeed);
        } else if (seedType == 'new' || seedType == 'load') {
            console.log('Chosen seed ' + chalk.cyanBright(inputSeed) + ' successfully wrote to ' +  chalk.yellowBright('RandomSeed.sql') + '!');
            if (seedType == 'new') {
                newProfile(inputSeed);
            } else if (seedType == 'load') {
                exitProcess(); //do this
            }
        } else if (seedType == 'day') {
            console.log('Random by ' + chalk.cyanBright('day') + ' successfully wrote to ' +  chalk.yellowBright('RandomSeed.sql') + '!');
            exitProcess();
        } else if (seedType == 'minute') {
            console.log('Random by ' + chalk.cyanBright('minute') + ' successfully wrote to ' +  chalk.yellowBright('RandomSeed.sql') + '!');
            exitProcess();
        }
    });
}

async function seedClipboard(inputSeed){
    const answers = await inquirer.prompt({
        name: 'copyToClipboard',
        type: 'list',
        message: 'Copy seed ' + chalk.cyanBright(inputSeed) + ' to clipboard?',
        choices: [
            'Yes',
            'No',
        ],
    });

    if (answers.copyToClipboard == 'Yes') {
        console.log('Seed ' + chalk.cyanBright(inputSeed) + ' copied to clipboard!');
        clipboard.writeSync(inputSeed.toString());
        newProfile(inputSeed);
    } else {
        newProfile(inputSeed);
    }
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

        console.log('New profile ' + chalk.cyanBright(answers.profileName) + ' created with seed ' + chalk.cyanBright(inputSeed) + '!');
        await exitProcess();
    }
}

function redoProfile(inputSeed) {
    createProfile(inputSeed);
}

//Start process
askUsePath();