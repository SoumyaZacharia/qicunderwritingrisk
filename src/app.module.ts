// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { BigQueryService } from './bigQuery.service';
import { ConfigModule } from '@nestjs/config';
import appConfiguration from './config/config'; // Import your named configuration function

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfiguration],
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`, // Highest precedence (e.g., .env.development.local)
        `.env.${process.env.NODE_ENV}`, // Next (e.g., .env.development)
        '.env.local', // Next (.env.local)
        '.env', // Lowest precedence (.env)
      ],
    }),
  ], //
  controllers: [AppController],

  providers: [AppService, BigQueryService],
})
export class AppModule {}
