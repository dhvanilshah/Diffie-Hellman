var DiffieHellman = function(p, g) {
  this.validateArguments(p, g);

  this.p = p;
  this.g = g;
};

DiffieHellman.prototype.validateArguments = function(p, g) {
  if (p <= 0) throw "Given prime number is out of range";

  if (!checkPrime(p) || !checkPrime(g)) throw "Given number is not primer";
};

DiffieHellman.prototype.getPublicKeyFromPrivateKey = function(privateKey) {
  if (privateKey <= 1 || this.p <= privateKey)
    throw "privateKey is out of range";

  return Math.pow(this.g, privateKey) % this.p;
};

DiffieHellman.prototype.getSharedSecret = function(privateKey, publicKey) {
  return Math.pow(publicKey, privateKey) % this.p;
};

function range(min, max) {
  var ret = [];
  for (var i = min; i <= max; i++) {
    ret.push(i);
  }
  return ret;
}

function checkPrime(v) {
  var max = ~~Math.sqrt(v);
  return range(2, max).every(function(i) {
    return v % i !== 0;
  });
}

module.exports = DiffieHellman;
