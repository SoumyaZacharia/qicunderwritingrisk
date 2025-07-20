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
    console.log('ingesting', data.data);
    await this.bigQueryService.ingestData(data.data);

    // const trafficAccidents = await lastValueFrom(
    //   this.httpService.get(dataLinks.trafficAccidents),
    // );
    // const rainfallData = await lastValueFrom(
    //   this.httpService.get(dataLinks.rainfallAverage),
    // );
    // await this.bigQueryService.fetchAllRows();
    /// console.log(realEstateNewsLetter[0]);

    // const data = val.data.results;
    // const csv = parse(data);
    // writeFileSync('data.csv', csv);

    //await this.bigQueryService.loadRealEstateDataToBQ();
    ///await this.bigQueryService.insertViolationRecords(data);
    return 'ok';
  }
}
