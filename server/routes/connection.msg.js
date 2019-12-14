const { Connection } = require("../database/connection.model");
const express = require("express");
const router = express.Router();
var forge = require("node-forge");

var key = forge.random.getBytesSync(16);

router.get("/tx", async (req, res) => {
  // Generating New IV
  var ivBytes = forge.random.getBytesSync(16);

  // Original msg from JSON
  var msgBytes = req.body.msg; //

  // Cipher
  var cipher = forge.cipher.createCipher("AES-CBC", key);
  cipher.start({ iv: ivBytes });
  cipher.update(forge.util.createBuffer(msgBytes));
  cipher.finish();

  // Convert encrypted msg and IV to Hex
  var encryptedHex = cipher.output.toHex();
  var ivHex = forge.util.bytesToHex(ivBytes);
  res.json({ msg: encryptedHex, iv: ivHex });
  return;
});

router.post("/rx", async (req, res) => {
  // Encrypted msg and IV from JSON
  console.log("received");
  var encryptedHex = req.body.msg;
  var ivHex = req.body.iv;
  var connection_id = req.body.id;
  var secret_key;

  console.log("The Encrypted Request Body: ", encryptedHex);

  if (connection_id) {
    const activeConnection = await Connection.findById(req.body.id);
    if (activeConnection) {
      secret_key = activeConnection.secret_key;
      if (!secret_key) {
        res.status(400).send("The Secret Key has not been set up");
      }
    }
  }

  var buf = Buffer.alloc(16);
  buf.fill(secret_key);
  console.log("buf.bl", buf.byteLength);
  var top_secret = forge.util.createBuffer(buf.toString("Binary"));

  // Convert Hex to Bytes
  var encryptedBytes = forge.util.hexToBytes(encryptedHex);
  var ivBytes = forge.util.hexToBytes(ivHex);

  // Decipher
  var decipher = forge.cipher.createDecipher("AES-CBC", top_secret);
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
    var msgBytes = decipher.output.toString();
    console.log("The Decrypted Message: ", msgBytes);
    // res.json({ msg: msgBytes });
    res.sendStatus(200);
    return;
  }
});

module.exports = router;
