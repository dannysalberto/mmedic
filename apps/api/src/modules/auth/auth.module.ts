import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

function parseExpiresInSeconds(val?: string): number {
  if (!val) return 60 * 60 * 24 * 7; // 7 days in seconds
  const cleaned = String(val).replace(/["']/g, '').trim().toLowerCase();

  if (/^\d+$/.test(cleaned)) {
    return parseInt(cleaned, 10);
  }

  const match = cleaned.match(/^(\d+)\s*(s|m|h|d|w)?$/);
  if (match) {
    const num = parseInt(match[1], 10);
    const unit = match[2] || 's';
    switch (unit) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 3600;
      case 'd': return num * 86400;
      case 'w': return num * 86400 * 7;
    }
  }

  return 60 * 60 * 24 * 7;
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const rawExpiresIn = config.get<string>('JWT_EXPIRES_IN');
        const expiresInSeconds = parseExpiresInSeconds(rawExpiresIn);

        return {
          secret:
            config.get<string>('JWT_SECRET') ||
            'super_secret_mmedic_jwt_key_2026_change_in_production',
          signOptions: {
            expiresIn: expiresInSeconds,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
