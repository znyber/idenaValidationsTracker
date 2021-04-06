const keccak256 = require('js-sha3').keccak256;
const secp256k1 = require('secp256k1');
exports.toHexString = function (byteArray, withPrefix) {
    return (
        (withPrefix ? '0x' : '') +
        Array.from(byteArray, function (byte) {
            return `0${(byte & 0xff).toString(16)}`.slice(-2)
        }).join('')
    )
}

function isHexPrefixed(str) {
    return str.slice(0, 2) === '0x'
}

function striphexprefix(str) {
    if (typeof str !== 'string') {
        return str
    }
    return isHexPrefixed(str) ? str.slice(2) : str
}

exports.hexToUint8Array = function (hexString) {
    const str = striphexprefix(hexString)
    const arrayBuffer = new Uint8Array(str.length / 2)
    for (let i = 0; i < str.length; i += 2) {
        const byteValue = parseInt(str.substr(i, 2), 16)
        arrayBuffer[i / 2] = byteValue
    }
    return arrayBuffer
}

exports.privateKeyToAddress = function (privateKey) {
    let pubKey = Buffer.from(secp256k1.publicKeyCreate(exports.hexToUint8Array(privateKey), false));
    return exports.toHexString(keccak256.array(pubKey.slice(1)).slice(12), true);
}