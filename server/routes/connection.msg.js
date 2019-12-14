const { Connection } = require("../database/connection.model");
const express = require("express");
const router = express.Router();
var forge = require('node-forge');

var key = forge.random.getBytesSync(16);

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

router.get("/tx", async (req, res) => {
  // Generating New IV
  var ivBytes = forge.random.getBytesSync(16);

  // Original msg from JSON
  var msgBytes = req.body.msg; //

  // Cipher
  var cipher = forge.cipher.createCipher('AES-CBC', key);
  cipher.start({ iv: ivBytes });
  cipher.update(forge.util.createBuffer(msgBytes));
  cipher.finish();

  // Convert encrypted msg and IV to Hex
  var encryptedHex = cipher.output.toHex();
  var ivHex = forge.util.bytesToHex(ivBytes);
  res.json({ "msg": encryptedHex, "iv": ivHex });
  return;
});

router.get("/rx", async (req, res) => {
  // Encrypted msg and IV from JSON
  var encryptedHex = req.body.msg;
  var ivHex = req.body.iv;

  // Convert Hex to Bytes
  var encryptedBytes = forge.util.hexToBytes(encryptedHex);
  var ivBytes = forge.util.hexToBytes(ivHex);

  // Decipher
  var decipher = forge.cipher.createDecipher('AES-CBC', key);
  decipher.start({ iv: ivBytes });
  decipher.update(forge.util.createBuffer(encryptedBytes));
  var result = decipher.finish();

  // check 'result' for true/false
  if (result == false) {
    console.log(result);
    res.sendStatus(400);
    return;
  }
  // Send Original msg in JSON
  else {
    var msgBytes = decipher.output.toString()
    console.log(msgBytes);
    res.json({ "msg": msgBytes });
    return;
  }

});

module.exports = router;
