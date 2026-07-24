

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const keysDir = path.join(__dirname, '..', 'keys');

if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

const privateKeyPath = path.join(keysDir, 'private.pem');
const publicKeyPath = path.join(keysDir, 'public.pem');

if (fs.existsSync(privateKeyPath) && !process.argv.includes('--force')) {
  console.log('Keys already exist. Use --force to regenerate.');
  console.log('  Private key:', privateKeyPath);
  console.log('  Public key: ', publicKeyPath);
  process.exit(0);
}

console.log('Generating RSA 2048-bit key pair...');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
fs.writeFileSync(publicKeyPath, publicKey, { mode: 0o644 });

console.log('Keys generated successfully:');
console.log('  Private key:', privateKeyPath, '(mode 600)');
console.log('  Public key: ', publicKeyPath, '(mode 644)');
console.log('\nIMPORTANT: Never commit the private key to git!');
