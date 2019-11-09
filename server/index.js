const express = require("express");
var cors = require("cors");

const app = express();
const port = 8080;

// Simple get request to check if the endpoint is working.
app.get("/", (req, res) => {
  res.send("Hello World!");
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

// Not sure if this is redundant but I've used this in the past and it works.
app.use(cors());

// Fire up the server at port specidied above.
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
