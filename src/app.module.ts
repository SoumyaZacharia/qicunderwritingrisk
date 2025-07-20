// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { BigQuery } from '@google-cloud/bigquery';
import { BigQueryService } from './bigQuery.service';

@Module({
  imports: [HttpModule], //
  controllers: [AppController],

  providers: [
    AppService,
    BigQueryService,
    {
      provide: BigQuery, // token
      useFactory: () => {
        return new BigQuery({
          keyFilename:
            '/Users/soumyazacharia/QIC/qic_underwriting/qicriskcalc-ed70ece6c640.json',
          projectId: 'qicriskcalc',
        });
      },
    },
  ],
})
export class AppModule {}
