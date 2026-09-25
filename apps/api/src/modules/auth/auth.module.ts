import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const rawExpiresIn = config.get<string>('JWT_EXPIRES_IN') || '7d';
        const cleanExpiresIn =
          typeof rawExpiresIn === 'string'
            ? rawExpiresIn.replace(/^['"]+|['"]+$/g, '').trim() || '7d'
            : rawExpiresIn;

        return {
          secret:
            config.get<string>('JWT_SECRET') ||
            'super_secret_mmedic_jwt_key_2026_change_in_production',
          signOptions: {
            expiresIn: cleanExpiresIn as any,
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
