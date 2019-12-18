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

const e = bigInt(65537);
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
