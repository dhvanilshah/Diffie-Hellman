const express = require("express");
const bodyParser = require("body-parser");
const webSocketServer = require("websocket").server;
const http = require("http");
var forge = require("node-forge");

var cors = require("cors");
const mongoose = require("mongoose");
var cookieParser = require("cookie-parser");

const connectionRoute = require("./routes/connection.route");

const app = express();
const port = 8080;

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
});

app.post("/", (req, res) => {
  console.log(req.body);
});

// Added a set of routes to test database calls
app.use("/connect", connectionRoute);

// Not sure if this is redundant but I've used this in the past and it works.
// app.use(cors());

// Fire up the server at port specidied above.
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
