import { Logger, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStartegy } from './strategies/jwt.strategy';
import { UserRepository } from '../common/database/user.repository';
import { User, UserSchema } from '../common/database/user.schema';
import { jwtOptions } from 'src/common/config/jwtConfig';
import { DatabaseModule } from 'src/common/database/database.module';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { CacheModule } from 'src/redis/redis.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync(jwtOptions),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    DatabaseModule,
    CacheModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          service: 'naver',
          host: 'smtp.naver.com',
          port: 587,
          auth: {
            user: configService.get('NAVER_EMAIL_ID'),
            pass: configService.get('NAVER_EMAIL_PW'),
          },
        },
        template: {
          dir: process.cwd + '/template/',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    JwtStartegy,
    RefreshTokenStrategy,
    Logger,
  ],
  exports: [JwtStartegy, PassportModule],
})
export class AuthModule {}
