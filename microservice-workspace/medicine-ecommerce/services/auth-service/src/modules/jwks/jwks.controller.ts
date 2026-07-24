import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { exportJWK, importSPKI } from 'jose';
import { Public } from '../../common/decorators/auth.decorators';

@ApiTags('JWKS')
@Controller('.well-known')
export class JwksController {
  private cachedJwks: any = null;

  constructor(private readonly configService: ConfigService) {}

  @Public()
  @Get('jwks.json')
  @ApiOperation({
    summary: 'Public keys for JWT verification (consumed by API gateway)',
  })
  async getJwks() {
    if (this.cachedJwks) return this.cachedJwks;

    const publicKeyPem = this.configService.get<string>('jwt.publicKey')!;
    const keyId = this.configService.get<string>('jwt.keyId')!;

    const publicKey = await importSPKI(publicKeyPem, 'RS256');
    const jwk = await exportJWK(publicKey);

    this.cachedJwks = {
      keys: [
        {
          ...jwk,
          kid: keyId,
          use: 'sig',
          alg: 'RS256',
        },
      ],
    };

    return this.cachedJwks;
  }
}
