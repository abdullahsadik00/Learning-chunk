const fs = require("fs");
console.log(process.argv[2]);

let todo = []
if (process.argv[2] === "add") {
    const data = fs.readFileSync("./todo.json", "utf-8");

    todo = JSON.parse(data);

    console.log(Object.keys(todo).length);
    todo[Object.keys(todo).length + 1] = {
        task: process.argv[3],
        done: false
    }
    fs.writeFileSync("./todo.json", JSON.stringify(todo));


}
else if (process.argv[2] == "list") {
    const data = fs.readFileSync("./todo.json", "utf-8");
    todo = JSON.parse(data);
    console.log(data);
    console.log(todo);
}
else if (process.argv[2] == "delete") { 
    const data = fs.readFileSync("./todo.json", "utf-8");
    todo = JSON.parse(data);
    if(Object.keys(todo).length < process.argv[3]){
        console.log("Invalid task number");
    }else {
        delete todo[process.argv[3]];
        fs.writeFileSync("./todo.json", JSON.stringify(todo));
        console.log("Task deleted successfully");
    }
} else if (process.argv[2] == "done") { 
    const data =  fs.readFileSync("./todo.json", "utf-8");
    todo = JSON.parse(data);
    if(Object.keys(todo).length < process.argv[3] || process.argv[3] <= 0 || process.argv[3] == undefined || Object.hasOwn(todo, process.argv[3]) == false){
        console.log("Invalid task number");
    }else {
        todo[process.argv[3]].done = true;
        fs.writeFileSync("./todo.json", JSON.stringify(todo));
        console.log("Task marked as done successfully");
    }
}