#!/usr/bin/env node
import { existsSync, writeFile, readFileSync, open } from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import clipboard from 'clipboardy';

//Utility function
function isNumber(val) {
    return /^\d+$/.test(val);
}

var lastPath = 'C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\content\\289070\\2823800402';
let userChosenPath = lastPath;

async function directoryTxtExist() {
    open('directory.txt', 'r', function(fileNotExists, file) {
        if (fileNotExists) {
            writeFile('directory.txt', 'C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\content\\289070\\2823800402', (err) => {
                if (err)
                    console.error(err);
                console.log(chalk.greenBright('\u2713 ') + chalk.yellowBright('directory.txt') + ' generated with default mod directory!');
                profilesJsonExist();
            });
        } else {
            console.log(chalk.greenBright('\u2713 ') + chalk.yellowBright('directory.txt') + chalk.greenBright(' found') + '!');
            lastPath = readFileSync('directory.txt', 'utf8');
            profilesJsonExist();
        }
    });
}

async function profilesJsonExist() {
    open('profiles.json', 'r', function(fileNotExists, file) {
        if (fileNotExists) {
            writeFile('profiles.json', '[ ]', (err) => {
                if (err)
                    console.error(err);
                console.log(chalk.greenBright('\u2713 ') + chalk.yellowBright('profiles.json') + ' generated. Create new profiles to load from it!');
                askUsePath();
            });
        } else {
            console.log(chalk.greenBright('\u2713 ') + chalk.yellowBright('profiles.json') + chalk.greenBright(' found') + '!');
            askUsePath();
        }
    });
}

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
        message: 'Input directory:',
    });

    await pathExists(answers.chosenPath);
}

async function pathExists(inputPath) {
    if (existsSync(inputPath)){
        console.log(chalk.greenBright('\u2713 ') + inputPath + chalk.greenBright(' found!'));
        userChosenPath = inputPath;
        if (existsSync(inputPath + '/RandomSeed.sql')) {
            console.log(chalk.greenBright('\u2713 ') + chalk.yellowBright('RandomSeed.sql') + chalk.greenBright(' found!'));
            writeFile('directory.txt', inputPath, function(err)
            {
                if (err)
                    return console.log(err);
                if (lastPath != userChosenPath)
                    console.log(chalk.greenBright('\u2713 ') + chalk.yellowBright('Directory.txt') + ' updated with chosen path!');
                seedingStart();
            });
        } else {
            console.log(chalk.redBright('\u26A0 ') + chalk.yellowBright('RandomSeed.sql') + chalk.redBright(' not found!'));
            await restartProcess();
        }
    } else {
        console.log(chalk.redBright('\u26A0 ') + inputPath + chalk.redBright(' not found!'));
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
            'Load seed from existing profile',
            'Import custom seed',
            'Choose another random solution',
            'Delete existing profile',
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
    } else if (answers.seedingChoice == 'Load seed from existing profile') {
        let profilesArray = JSON.parse(readFileSync('profiles.json'));

        if (profilesArray.length <= 0) {
            console.log(chalk.redBright('\u26A0') + ' No profiles exist, one must be made before it can be loaded!');
            await restartProcess();
            return;
        }

        var newProfilesArray = [];
        for (var i = 0; i < profilesArray.length; i++) {
            newProfilesArray.push(profilesArray[i].name + ' (' + profilesArray[i].seed + ')');
        }

        const subAnswers = await inquirer.prompt({
            name: 'profChoice',
            type: 'list',
            message: 'Choose Profile:',
            choices: newProfilesArray
        });

        await writeSeed(profilesArray[newProfilesArray.indexOf(subAnswers.profChoice)].seed, 'load');
    } else if (answers.seedingChoice == 'Import custom seed') {
        const subAnswers = await inquirer.prompt({
            name: 'chosenSeed',
            type: 'number',
            message: 'Input seed:',
        });

        if (isNumber(subAnswers.chosenSeed)){
            await writeSeed(subAnswers.chosenSeed, 'new');
        } else {
            console.log(chalk.redBright('\u26A0') + ' Seed can only contain numbers!');
            seedingStart.call(this);
        }
    } else if (answers.seedingChoice == 'Choose another random solution') {
        await otherSolutions();
    } else if (answers.seedingChoice == 'Delete existing profile') {
        let profilesArray = JSON.parse(readFileSync('profiles.json'));

        if (profilesArray.length <= 0) {
            console.log(chalk.redBright('\u26A0') + ' No profiles exist, one must be made before it can be deleted!');
            await restartProcess();
            return;
        }

        var newProfilesArray = [];
        for (var i = 0; i < profilesArray.length; i++) {
            newProfilesArray.push(profilesArray[i].name + ' (' + profilesArray[i].seed + ')');
        }

        const subAnswers = await inquirer.prompt({
            name: 'profChoice',
            type: 'list',
            message: 'Choose profile to delete:',
            choices: newProfilesArray
        });

        await deleteProfiles(newProfilesArray.indexOf(subAnswers.profChoice), profilesArray);
    }
}

async function deleteProfiles(index, profArray) {
    let seedVal = profArray[index].seed;
    let nameVal = profArray[index].name;

    profArray.splice(index, 1);

    writeFile('profiles.json', JSON.stringify(profArray, null, 4), function(err){
        if (err)
            return console.log(err);
    });

    console.log(chalk.greenBright('\u2713 ') + 'Deleted profile ' + chalk.cyanBright(nameVal) + '! (' + chalk.cyanBright(seedVal) + ')');
    await exitProcess();
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
    writeFile(userChosenPath + '\\RandomSeed.sql', "INSERT OR IGNORE INTO GlobalParameters (Name, 'Value') VALUES ('WW_RANDOM_SEED', " + inputSeed + ");", function(err)
    {
        if (err)
            return console.log(err);
        if (seedType == 'random') {
            console.log(chalk.greenBright('\u2713 ') + 'Random seed ' + chalk.cyanBright(inputSeed) + ' successfully wrote to ' +  chalk.yellowBright('RandomSeed.sql') + '!');
            seedClipboard(inputSeed);
        } else if (seedType == 'new' || seedType == 'load') {
            console.log(chalk.greenBright('\u2713 ') + 'Chosen seed ' + chalk.cyanBright(inputSeed) + ' successfully wrote to ' +  chalk.yellowBright('RandomSeed.sql') + '!');
            if (seedType == 'new') {
                newProfile(inputSeed);
            } else if (seedType == 'load') {
                exitProcess();
            }
        } else if (seedType == 'day') {
            console.log(chalk.greenBright('\u2713 ') + 'Random by ' + chalk.cyanBright('day') + ' successfully wrote to ' +  chalk.yellowBright('RandomSeed.sql') + '!');
            exitProcess();
        } else if (seedType == 'minute') {
            console.log(chalk.greenBright('\u2713 ') + 'Random by ' + chalk.cyanBright('minute') + ' successfully wrote to ' +  chalk.yellowBright('RandomSeed.sql') + '!');
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
        console.log(chalk.greenBright('\u2713 ') + 'Seed ' + chalk.cyanBright(inputSeed) + ' copied to clipboard!');
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
        console.log(chalk.redBright('\u26A0 ') + 'Profile name cannot be nothing!');
        redoProfile(inputSeed);
    } else {
        const filename = 'profiles.json';

        let today = new Date();
        let newProfileDefinition = {
            name: answers.profileName,
            seed: inputSeed,
            date_saved: today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate() + ' ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
        };

        var data = readFileSync(filename);
        var myObject = JSON.parse(data);

        myObject.push(newProfileDefinition);

        writeFile(filename, JSON.stringify(myObject, null, 4), function(err){
            if (err)
                return console.log(err);
        });

        console.log(chalk.greenBright('\u2713 ') + 'New profile ' + chalk.cyanBright(answers.profileName) + ' created with seed ' + chalk.cyanBright(inputSeed) + '!');
        await exitProcess();
    }
}

function redoProfile(inputSeed) {
    createProfile(inputSeed);
}

//Start process
directoryTxtExist();