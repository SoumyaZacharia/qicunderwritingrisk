// src/bigquery.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { BigQuery } from '@google-cloud/bigquery';
import { parse } from 'json2csv';
import { dataLinks } from './data.links';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BigQueryService {
  private readonly bigquery: BigQuery;
  private readonly logger = new Logger(BigQueryService.name);

  constructor(private readonly httpService: HttpService) {
    if (process.env.NODE_ENV == 'testing')
      this.bigquery = new BigQuery({
        projectId: 'qicriskcalc',
        keyFilename: process.env.BIG_QUERY_KEY_FILE_NAME,
        //    '/Users/soumyazacharia/QIC/qic_underwriting/qicriskcalc-ed70ece6c640.json',
      });
    else {
      console.log('default');
      this.bigquery = new BigQuery({
        projectId: 'qicriskcalc',
      });
    }
  }

  async ingestData(data: string): Promise<string> {
    const dataset = 'qicData';

    const ingestionMap = {
      trafficAccidents: async () => {
        const url = dataLinks.trafficAccidents;
        const table = 'trafficAccidents';
        const { data: response } = await lastValueFrom(
          this.httpService.get(url),
        );
        await this.delete(table, dataset);
        await this.loadAccidentsDataToBQ(response.results, dataset, table);
        return `Successfully inserted ${data} to BigQuery`;
      },

      realEstate: async () => {
        const url = dataLinks.realEstateNewsLetter;

        const table = 'realEstate';
        await this.delete(table, dataset);
        await this.fetchAllRows(dataset, table);
        return `Successfully inserted ${data} to BigQuery`;
      },

      rainfall: async () => {
        const url = dataLinks.rainfallAverage;
        const table = 'rainfall';
        const { data: response } = await lastValueFrom(
          this.httpService.get(url),
        );
        await this.delete(table, dataset);
        await this.loadRainfallData(response.results, dataset, table);
        return `Successfully inserted ${data} to BigQuery`;
      },
    };

    try {
      const handler = ingestionMap[data];
      if (!handler) {
        return `Invalid data type: ${data}`;
      }

      return await handler();
    } catch (err) {
      this.logger.error(`Data ingestion failed for ${data}:`, err);
      return `Data ingestion to BigQuery failed: ${err.message || err}`;
    }
  }

  async delete(table: string, dataset: string) {
    const [exists] = await this.bigquery.dataset(dataset).table(table).exists();
    if (exists == true) {
      await this.bigquery.dataset(dataset).table(table).delete();
    }
  }
  async loadAccidentsDataToBQ(records, dataset, table) {
    const schema = [
      { name: 'year', type: 'STRING' },
      { name: 'result_of_the_accident', type: 'STRING' },
      { name: 'number_of_people', type: 'INTEGER' },
      { name: 'result_of_the_accident_ar', type: 'STRING' },
    ];
    await this.bigquery.dataset(dataset).createTable(table, {
      schema: schema,
    });
    const options = {
      skipInvalidRows: true,
      ignoreUnknownValues: true,
      schema: schema,
      // ],
    };
    await this.insertBigqueryRecords(records, options, dataset, table);
  }

  async loadRainfallData(records, dataset: string, table: string) {
    const schema = [
      { name: '2016', type: 'FLOAT', mode: 'NULLABLE' },
      { name: '2017', type: 'FLOAT', mode: 'NULLABLE' },
      { name: '2018', type: 'FLOAT', mode: 'NULLABLE' },
      { name: '2019', type: 'FLOAT', mode: 'NULLABLE' },
      { name: '2020', type: 'FLOAT', mode: 'NULLABLE' },
      { name: '2021', type: 'FLOAT', mode: 'NULLABLE' },
      { name: 'station', type: 'STRING', mode: 'NULLABLE' },
    ];
    const options = {
      skipInvalidRows: true,
      ignoreUnknownValues: true,
      schema: schema,
    };
    await this.bigquery.dataset(dataset).createTable(table, {
      schema: schema,
    });
    await this.insertBigqueryRecords(records, options, dataset, table);
  }

  async insertBigqueryRecords(rows, options, dataset, table): Promise<void> {
    await this.bigquery.dataset(dataset).table(table).insert(rows, options);
    this.logger.log(`Inserted ${rows.length} rows successfully.`);
  }
  catch(err) {
    this.logger.error('Failed to insert into BigQuery:', err);
    if (err.name === 'PartialFailureError') {
      for (const error of err.errors) {
        this.logger.error(`Row Error: ${JSON.stringify(error.errors)}`);
      }
    }
    throw err;

    //
  }
  async fetchAllRows(dataset, table) {
    const baseUrl = dataLinks.realEstateNewsLetter;
    const limit = 100; // max per page
    let offset = 0;
    let allRecords: any[] = [];
    let hasMore = true;
    const schema = [
      { name: 'date_of_contract', type: 'DATE' },
      { name: 'municipality_name', type: 'STRING' },
      { name: 'sm_lbldy', type: 'STRING' },
      { name: 'zone_name', type: 'STRING' },
      { name: 'sm_lmntq', type: 'STRING' },
      { name: 'real_estate_type', type: 'STRING' },
      { name: 'nw_l_qr', type: 'STRING' },
      { name: 'area_in_square_meters', type: 'FLOAT' },
      { name: 'price_per_square_foot', type: 'FLOAT' },
      { name: 'real_estate_value', type: 'FLOAT' },
      {
        name: 'geo_point_2d',
        type: 'RECORD',
        mode: 'NULLABLE',
        fields: [
          { name: 'lon', type: 'FLOAT' },
          { name: 'lat', type: 'FLOAT' },
        ],
      },
    ];
    const options = {
      skipInvalidRows: true,
      ignoreUnknownValues: true,
      schema: schema,
    };
    await this.bigquery.dataset('qicData').createTable(table, {
      schema: schema,
    });

    while (hasMore) {
      const url = `${baseUrl}limit=${limit}&offset=${offset}`;
      console.log(url);
      const record = await lastValueFrom(this.httpService.get(url));

      const records = record?.data?.results;
      const opts = {
        quote: '"',
        quoteFields: (field, value) => typeof value === 'string', // only quote strings
      };
      await this.insertBigqueryRecords(records, options, dataset, table);
      try {
        console.log(records[0]);
        await this.bigquery
          .dataset('qicData')
          .table('realEstate')
          .insert(records, options);
        this.logger.log(`Inserted ${records.length} rows successfully.`);
      } catch (err) {
        this.logger.error('Failed to insert into BigQuery:', err);
        if (err.name === 'PartialFailureError') {
          for (const error of err.errors) {
            this.logger.error(`Row Error: ${JSON.stringify(error.errors)}`);
          }
        }
        throw err;
      }

      // Check if we received fewer than requested — means last page
      hasMore = records.length === limit;
      offset += limit;
      console.log(offset, 'offset');
    }
  }
}
