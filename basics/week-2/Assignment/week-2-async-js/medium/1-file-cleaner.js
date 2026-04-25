const fs = require('fs')
fs.readFile('example.txt', 'utf-8', (err, data) => {
    if (!err) {
        let withoutSpaces = data.replace(/\s+/g, ' ')
        console.log("With Spaces",data)
        console.log("Without Spaces",withoutSpaces)
        fs.writeFile('example.txt', withoutSpaces, (err, data) => {
            if (!err) {
                console.log("Sucessful")
            } else {
                console.log("not Sucessful")
            }
        })
    }
})