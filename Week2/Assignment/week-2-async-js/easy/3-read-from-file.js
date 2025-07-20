const fs = require('fs');
fs.readFile('sample.txt','utf-8',(err,data)=>{
    if(err){
        if(err.code === 'ENONET'){
            console.error('File not found')
        }else{
            console.error('Error reading file',err)
        }
        return
    }
    console.log('File Content', data)
})

// Expensive operation: A simple, large computational task
const expensiveOperation = () => {
    let sum = 0;
    for (let i = 0; i < 1000000; i++) { 
      sum += i;
    }
    console.log('Expensive operation done',sum);
  };
  
  
  expensiveOperation();
  