const express = require("express");
const bodyParser = require('body-parser');
const webSocketServer = require('websocket').server;
const http = require('http');

var cors = require("cors");
const mongoose = require("mongoose");
var cookieParser = require("cookie-parser");

const connectionRoute = require("./routes/connection.route");

const app = express();
const port = 8080;
const wsport = 8000;

const typesDef = {
  USER_EVENT: "userevent",
  CONTENT_CHANGE: "contentchange"
};
const clients = {};
const users = {};
let editorContent = null;

const server = http.createServer();
server.listen(wsport);
const wsServer = new webSocketServer({
  httpServer: server
});

// SOME STUFF TO PREVENET CORS ISSUES IN BROWSER
// Allows users to access the server running locally on a machine via the machine's IP address
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

mongoose
  .connect("mongodb://localhost:27017/diffie-helman-project", {
    useNewUrlParser: true
  })
  .then(() => console.log("Connected to MongoDB..."))
  .catch(err => console.error("Could not connect to MongoDB..."));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple get request to check if the endpoint is working.
app.get("/", (req, res) => {
  res.send("Hello World!");
  console.log("Hello");
});

app.post("/", (req, res) => {
  console.log(req.body);
});

// Added a set of routes to test database calls
app.use("/test", connectionRoute);

const getUniqueID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
};


const sendMessage = (json) => {
  Object.keys(clients).map((client) => {
    clients[client].sendUTF(json);
  });
};

wsServer.on('request', function(request) {
  var userID = getUniqueID();
  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
  const connection = request.accept(null, request.origin);
  clients[userID] = connection;
  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients));
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      const dataFromClient = JSON.parse(message.utf8Data);
      const json = { type: dataFromClient.type };
      if (dataFromClient.type === typesDef.USER_EVENT) {
        users[userID] = dataFromClient;
        json.data = { users };
      } else if (dataFromClient.type === typesDef.CONTENT_CHANGE) {
        editorContent = dataFromClient.content;
        json.data = { editorContent };
      }
      sendMessage(JSON.stringify(json));
    }
  });
});


// Not sure if this is redundant but I've used this in the past and it works.
// app.use(cors());

// Fire up the server at port specidied above.
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
