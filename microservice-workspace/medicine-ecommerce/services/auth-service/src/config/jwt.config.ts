import { registerAs } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export default registerAs('jwt', () => {
  const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH || './keys/private.pem';
  const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem';

  let privateKey = '';
  let publicKey = '';

  try {
    privateKey = fs.readFileSync(path.resolve(privateKeyPath), 'utf-8');
    publicKey = fs.readFileSync(path.resolve(publicKeyPath), 'utf-8');
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(
        '[JWT Config] Failed to load RSA keys. Run: npm run keys:generate',
      );
    }
  }

  return {
    issuer: process.env.JWT_ISSUER || 'medicine-ecommerce-auth',
    audience: process.env.JWT_AUDIENCE || 'medicine-ecommerce',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
    keyId: process.env.JWT_KEY_ID || 'auth-key-1',
    algorithm: 'RS256' as const,
    privateKey,
    publicKey,
  };
});
