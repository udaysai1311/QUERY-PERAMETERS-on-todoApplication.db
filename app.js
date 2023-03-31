const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// API 1
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let dbData = null;
  let getQuery = "";
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getQuery = `SELECT * 
                  FROM todo 
                  WHERE todo LIKE '%${search_q}%'
                      AND status = '${status}' AND priority = '${priority}';`;
      break;
    case hasPriority(request.query):
      getQuery = `SELECT * 
                  FROM todo 
                  WHERE todo LIKE '%${search_q}%'
                      AND priority = '${priority}';`;
      break;
    case hasStatus(request.query):
      getQuery = `SELECT * 
                  FROM todo 
                  WHERE todo LIKE '%${search_q}%'
                      AND status = '${status}';`;
      break;
    default:
      getQuery = `SELECT * 
                  FROM todo 
                  WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  dbData = await db.all(getQuery);
  response.send(dbData);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const dbData = await db.get(getQuery);
  response.send(dbData);
});

// API 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postQuery = `INSERT INTO todo(id, todo, priority, status)
                       VALUES  (${id},
                                '${todo}',
                                '${priority}',
                                '${status}');`;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});

//API 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status } = request.body;
  let needToUpdate = "";
  let updateQuery = "";
  switch (true) {
    case request.body.todo !== undefined:
      needToUpdate = "todo";
      break;
    case request.body.priority !== undefined:
      needToUpdate = "priority";
      break;
    case request.body.status !== undefined:
      needToUpdate = "status";
      break;
    default:
      needToUpdate = "all";
      break;
  }
  if (needToUpdate === "todo") {
    updateQuery = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
    await db.run(updateQuery);
    response.send("Todo Updated");
  } else if (needToUpdate === "priority") {
    updateQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
    await db.run(updateQuery);
    response.send("Priority Updated");
  } else if (needToUpdate === "status") {
    updateQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
    await db.run(updateQuery);
    response.send("Status Updated");
  }
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
