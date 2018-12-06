////////////////////////////
// var math = require('./lib/mymath');
// var result = null;

const ecc = require('eosjs-ecc');
const secp256k1 = require('secp256k1');


// result = math.add(5, 2);
// console.log("result is:", result);

// ecc.randomKey().then(privateKey => {
//     console.log('Private Key:\t', privateKey) // wif
//     console.log('Public Key:\t', ecc.privateToPublic(privateKey)) // EOSkey...
// });
//
//
// Private Key:     5JVVomKC8LWKA2niSqXn3rQNW2q16K6Swt1TM3C2eDxMqbvGxpJ
// Public Key:      EOS6bk8EzJwYU39GwTzPw7Y5NHKphPJ6bHDfhKyUnKLNKBkmfARaT

var privateKey = "5JVVomKC8LWKA2niSqXn3rQNW2q16K6Swt1TM3C2eDxMqbvGxpJ";
var data = "I'm good";


console.log('\n\nstart -->', new Date().toLocaleString());
var signature = ecc.sign(data, privateKey);

console.log('end -->', new Date().toLocaleString());
console.log('\n\ninput:', data);
console.log('output:', signature);

console.log('\n\n');




//var sigObj = secp256k1.sign(dataBuf, privateKeyBuf);
//console.log(sigObj.signature);

console.log('\n\n');
