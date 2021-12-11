const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found" });
  }

  request.user = user;

  return next();
}

function checkUserAlreadyExists(request, response, next) {
  const { username } = request.body;

  const usernameExists = users.some((user) => user.username === username);

  if (usernameExists) {
    return response.status(400).json({ error: "User already exists" });
  }

  return next();
}

function checkTodoExists(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  const { id } = request.params;

  const todoExists = user.todos.some((todo) => todo.id === id);

  if (!todoExists) {
    return response.status(404).json({ error: "Todo not found" });
  }

  return next();
}

app.post("/users", checkUserAlreadyExists, (request, response) => {
  const { name, username } = request.body;

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  return response.status(201).send(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  const { title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checkTodoExists,
  (request, response) => {
    const { user } = request;

    const { id } = request.params;
    const { title, deadline } = request.body;

    const todoToBeChanged = user.todos.find((todo) => todo.id === id);

    todoToBeChanged.title = title;
    todoToBeChanged.deadline = deadline;

    return response.json(todoToBeChanged);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checkTodoExists,
  (request, response) => {
    const { user } = request;

    const { id } = request.params;

    const todoToBeCompleted = user.todos.find((todo) => todo.id === id);

    todoToBeCompleted.done = true;

    return response.json(todoToBeCompleted);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checkTodoExists,
  (request, response) => {
    const { user } = request;

    const { id } = request.params;

    const todoIndex = user.todos.findIndex((todo) => todo.id === id);

    user.todos.splice(todoIndex, 1);

    return response.status(204).json(user.todos);
  }
);

module.exports = app;
