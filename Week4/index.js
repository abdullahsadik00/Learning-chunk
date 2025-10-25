const fs = require('fs');
function main(filePath) {
    console.log();
    fs.readFile(filePath, 'utf8', (err, data) => {
        var len = data.split(' ').length
        if (err) {
            console.error("Error reading file:", err);
            return;
        }
        console.log("This file contain", len, "words");
    });
}

main(process.argv[2]);