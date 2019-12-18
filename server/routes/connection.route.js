const { Connection } = require("../database/connection.model");
const express = require("express");
const router = express.Router();
const DiffieHelman = require("../diffie-helman/dh");
var bigInt = require("big-integer");
var forge = require("node-forge");
const privateKey = require("../diffie-helman/privateKey");
const BigNumber = require("bignumber.js");

RSAgenerate = keysize => {
  function randomPrime(bits) {
    const min = bigInt(6074001000).shiftLeft(bits - 33); // min ≈ √2 × 2^(bits - 1)
    const max = bigInt.one.shiftLeft(bits).minus(1); // max = 2^(bits) - 1
    for (;;) {
      const p = bigInt.randBetween(min, max); // WARNING: not a cryptographically secure RNG!
      if (p.isProbablePrime(256)) {
        return p;
      }
    }
  }
  const e = bigInt(37);
  let p;
  let q;
  let lambda;
  do {
    p = randomPrime(keysize / 2);
    q = randomPrime(keysize / 2);
    lambda = bigInt.lcm(p.minus(1), q.minus(1));
  } while (
    bigInt.gcd(e, lambda).notEquals(1) ||
    p
      .minus(q)
      .abs()
      .shiftRight(keysize / 2 - 100)
      .isZero()
  );
  console.log(
    "RSA Func",
    p.multiply(q).toArray(100),
    e.toArray(100),
    e.modInv(lambda).toArray(100)
  );
  return {
    n: p.multiply(q), // public key (part I)
    e: e, // public key (part II)
    d: e.modInv(lambda) // private key d = e^(-1) mod λ(n)
  };
};

// var asym_key = RSAgenerate(8);

var asym_key = {
  n: bigInt.fromArray([1, 43], 100),
  e: bigInt.fromArray([37], 100),
  d: bigInt.fromArray([13], 100)
};

RSAdecrypt = (c, d, n) => {
  const decryptedB = bigInt.fromArray(c, 100).modPow(d, n);
  return decryptedB.toString();
};

router.get("/ask", async (req, res) => {
  console.log(asym_key["d"]);
  console.log(asym_key["n"]);
  console.log(asym_key["e"]);
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
  cookie = connection._id.toString();
  const resp = {
    p,
    g,
    key: key.toString(),
    id: cookie,
    e: asym_key["e"].toArray(100),
    n: asym_key["n"].toArray(100)
  };
  res.send(resp);
});

router.post("/ask", async (req, res) => {
  if (req.body.id) {
    const activeConnection = await Connection.findById(req.body.id);
    if (activeConnection) {
      console.log(
        "req body b",
        req.body.B,
        "req body d",
        asym_key["d"],
        "req body n",
        asym_key["n"]
      );

      const B = RSAdecrypt(req.body.B.value, asym_key["d"], asym_key["n"]);
      console.log("decrypted b", B);
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
