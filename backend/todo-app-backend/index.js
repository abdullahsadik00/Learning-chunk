const express = require('express')

const app = express()
app.use(express.json());

let todos = []
app.get('/', (req, res) => {
    res.json(
        {
            hasError: false,
            todos
        })
})

app.post('/', (req, res) => {

    const { todo } = req.body;
    id = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
    todos.push({
        id,
        todo
    });

    res.json({ message: "POST request received" })
})

app.put('/:id',(req,res)=>{
    const {id} = req.params;
    const {todo} = req.body;

    console.log("id :", id);
    console.log("todo :", todo);
    let todoItem = todos.find(t =>t.id == id);
    console.log("todoItem :", todoItem);
    if(todoItem) {
        todoItem.todo = todo + " (updated)";
        res.json({ message: `Todo with ID ${id} updated.` })
    }
})
app.listen(3000)