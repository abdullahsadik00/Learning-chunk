const fs = require('fs');
const { Command } = require('commander');
const program = new Command();

const filePath = 'todos.json';
program.name('todo')
    .description('Simple CLI Todo Application')
    .version('1.0.0');

program.command('add')
    .description('Add a new todo item')
    .argument('<item>', 'Todo item to add')
    .action((item) => {
        console.log(`Added todo: ${item}`);

        fs.readFile(filePath, 'utf8', (err, data) => {
            let todos = [];
            if (!err && data.trim()) {
                todos = JSON.parse(data);
            }

            // Find the next available ID (max existing ID + 1)
            const nextId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;

            todos.push({ id: nextId, item });

            console.log("There are total ", todos.length, " todos");
            console.log("read file todos :", todos);

            fs.writeFile(filePath, JSON.stringify(todos, null, 4), 'utf8', (err) => {
                if (err) {
                    console.error("Error saving todo:", err);
                }
            });
        });
    });


program.command('update').description('Update a todo item')
    .argument('<id>', 'ID of the todo item to update')
    .argument('<item>', 'Updated todo item')
    .action((id, item) => {
        console.log(`Updated todo with ID: ${id}`);
        fs.readFile(filePath, 'utf8', (err, data) => {
            let todos = [];
            if (!err) {
                todos = JSON.parse(data);
                let todo = todos.find(t => t.id == id);
                if (todo) {
                    todo.item = item + " (updated)";
                    fs.writeFile(filePath, JSON.stringify(todos, null, 2), 'utf8', (err) => {
                        if (err) {
                            console.error("Error updating todo:", err);
                        }
                    });
                } else {
                    console.log(`Todo with ID ${id} not found.`);
                }
            }
        });
    });

program.command('list')
    .description('List all todo items')
    .action(() => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading todos:", err);
                return;
            }
            const todos = JSON.parse(data);
            todos.forEach(todo => {
                console.log(`${todo.id}: ${todo.item}`);
            });
        });
    });

program.command('delete')
    .description('Delete a todo item')
    .argument('<id>', 'ID of the todo item to delete')
    .action((id) => {
        console.log(`Deleted todo with ID: ${id}`);
        fs.readFile(filePath, 'utf8', (err, data) => {
            let todos = [];
            if (!err) {
                todos = JSON.parse(data);
                todos = todos.filter(t => t.id != id);
                fs.writeFile(filePath, JSON.stringify(todos, null, 2), 'utf8', (err) => {
                    if (err) {
                        console.error("Error deleting todo:", err);
                    }
                });
            }
        });
    });

program.parse(process.argv);