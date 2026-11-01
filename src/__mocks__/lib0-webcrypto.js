const { webcrypto } = require('crypto');

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
}

module.exports = webcrypto;

