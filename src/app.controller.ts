import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { AppService } from './app.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { BigQuery } from '@google-cloud/bigquery';
import { BigQueryService } from './bigQuery.service';
import { dataLinks } from './data.links';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly httpService: HttpService,
    private readonly bigQueryService: BigQueryService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('/ingest')
  async ingestData(@Body() data: any): Promise<string> {
    const message = await this.bigQueryService.ingestData(data.data);

    return message;
  }
}
