const { Connection } = require("../database/connection.model");
const express = require("express");
const router = express.Router();
const DiffieHelman = require("../diffie-helman/dh");
var forge = require("node-forge");
const privateKey = require("../diffie-helman/privateKey");
const BigNumber = require("bignumber.js");

router.get("/ask", async (req, res) => {
  var bits = 9;
  let g, p;

  forge.prime.generateProbablePrime(bits, function(err, num) {
    p = parseInt(num.toString());
  });

  forge.prime.generateProbablePrime(bits, function(err, num) {
    g = parseInt(num.toString());
  });

  const key = BigNumber(g)
    .exponentiatedBy(privateKey)
    .modulo(p);

  const connection = new Connection({
    p: p,
    g: g
  });

  await connection.save();

  // SEND "_id" AS USER_ID COOKIE
  res.cookie("USER_ID", connection._id.toString());
  console.log(res.cookie);
  cookie = connection._id.toString();
  const resp = { p, g, key: key.toString(), id: cookie };
  res.send(resp);
});

router.post("/ask", async (req, res) => {
  if (req.body.id) {
    const activeConnection = await Connection.findById(req.body.id);
    if (activeConnection) {
      const B = req.body.B;
      const secret_key = BigNumber(B)
        .exponentiatedBy(privateKey)
        .modulo(activeConnection.p);
      console.log(B, secret_key.toString());
      activeConnection.secret_key = parseInt(secret_key.toString());
      await activeConnection.save();
      res.sendStatus(200);
      return;
    }
    console.log("no connection found");
    res.sendStatus(400);
    return;
  }
  console.log("no cookies found");
  res.sendStatus(400);
  return;
});

router.get("/create", async (req, res) => {
  console.time("test");
  // TEST FOR USER_ID COOKIE. IF THE COOKIE IS PRESENT, SEND ROUTE FORBIDDEN RESPONSE
  if (req.cookies.USER_ID) {
    const activeConnection = await Connection.findById(req.cookies.USER_ID);
    if (activeConnection) {
      console.timeEnd("test");
      res.sendStatus(403);
      return;
    }
  }

  // IF USER_ID COOKIE IS NOT PRESENT, CREATE A NEW CONNECTION INSTANCE IN DATABSE
  // @param "secret_key" should be replaced with secret key generated from DH key exchange
  const connection = new Connection({
    secret_key: "TESTSECRETKEY"
  });

  await connection.save();

  // SEND "_id" AS USER_ID COOKIE
  res.cookie("USER_ID", connection._id.toString());
  console.timeEnd("test");
  res.sendStatus(200);
});
module.exports = router;
