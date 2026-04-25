const fs = require('fs')
fs.readFile('sample.txt', 'utf-8', (err, data) => {
    if (data) {
        fs.writeFile('sample2.txt', 'new data\n' + data, (err1, writeData) => {
            if (err1) {
                console.log("errror")
            } if (writeData) {
                console.log(writeData)
            }
            console.log('err1',err1)
            console.log('writeData',writeData)
        })
    }
    console.log('err',err)
    console.log('data',data)
})