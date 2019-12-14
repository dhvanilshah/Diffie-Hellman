const { Connection } = require("../database/connection.model");
const express = require("express");
const router = express.Router();

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
