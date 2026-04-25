const fs = require('fs');
const { Command } = require('commander');
const program = new Command();

program.name('word-counter')
    .description('Counts the number of words in a text file')
    .version('1.0.0');

program.command('count')
    .description('Count words in the specified file')
    .argument('<file>', 'Path to the text file')
    .action((file) => {
        console.log("Counting words in file:", file);
        main(file);
    });

function main(filePath) {
    console.log('Reading file:', filePath);
    fs.readFile(filePath, 'utf8', (err, data) => {

        if (err) {
            console.error("Error reading file:", err);
            return;
        }
        var len = data.split(' ').length
        console.log("This file contain", len, "words");
    });
}
program.parse(process.argv);