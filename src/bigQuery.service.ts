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
    this.bigquery = new BigQuery({
      keyFilename:
        '/Users/soumyazacharia/QIC/qic_underwriting/qicriskcalc-ed70ece6c640.json',
      projectId: 'qicriskcalc',
    });
  }
  async ingestData(data) {
    let url: string;
    let dataset = 'qicData';
    let table: string;
    if (data == 'trafficAccidents') {
      url = dataLinks.trafficAccidents;
      table = 'trafficAccidents';
      const trafficAccidents = await lastValueFrom(this.httpService.get(url));
      console.log('deleting');
      await this.delete(table, dataset);
      await this.loadAccidentsDataToBQ(
        trafficAccidents.data.results,
        dataset,
        table,
      );
    } else if (data == 'realEstate') {
      url = dataLinks.realEstateNewsLetter;
      table = 'realEstate';
      await this.delete(table, dataset);
      await this.fetchAllRows(dataset, table);
    } else if (data == 'rainfall') {
      url = dataLinks.rainfallAverage;
      table = 'rainfall';
      await this.delete(table, dataset);
    }
  }

  async delete(table: string, dataset: string) {
    const [exists] = await this.bigquery.dataset(dataset).table(table).exists();
    if (exists == true) {
      await this.bigquery.dataset(dataset).table(table).delete();
    }
  }
  async loadAccidentsDataToBQ(records, dataset, table) {
    const options = {
      skipInvalidRows: true,
      ignoreUnknownValues: true,
      schema: [
        { name: 'year', type: 'STRING' },
        { name: 'result_of_the_accident', type: 'STRING' },
        { name: 'number_of_people', type: 'INTEGER' },
        { name: 'result_of_the_accident_ar', type: 'STRING' },
      ],
      // ],
    };
    console.log('inserting', records);
    await this.insertBigqueryRecords(records, options, dataset, table);
  }

  // // Upload the local file
  // const [job] = await this.bigquery
  //   .dataset(this.datasetId)
  //   .table(this.tableId)
  //   .load('data.csv', metadata);

  async loadRainfallData(records, dataset: string, table: string) {
    const options = {
      skipInvalidRows: true,
      ignoreUnknownValues: true,
      schema: [
        { name: '2016', type: 'FLOAT', mode: 'NULLABLE' },
        { name: '2017', type: 'FLOAT', mode: 'NULLABLE' },
        { name: '2018', type: 'FLOAT', mode: 'NULLABLE' },
        { name: '2019', type: 'FLOAT', mode: 'NULLABLE' },
        { name: '2020', type: 'FLOAT', mode: 'NULLABLE' },
        { name: '2021', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'station', type: 'STRING', mode: 'NULLABLE' },
      ],
    };
    await this.insertBigqueryRecords(records, options, dataset, table);
  }

  async loadRealEstateDataToBQ() {
    const metadata = {
      sourceFormat: 'CSV',
      skipLeadingRows: 1,
      fieldDelimiter: '|',
      quote: '"',
      writeDisposition: 'WRITE_TRUNCATE', //replace all rows
      schema: {
        fields: [
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
          { name: 'geo_point_2d', type: 'RECORD' },
        ],
      },
    };
    //Date of Contract;Municipality Name;اسم البلدية;Zone Name;اسم المنطقة;Real Estate Type;نوع العقار;Area in Square Meters;Price per Square Foot;Real Estate Value;geo_point_2d
    console.log('ingesting 2');
    // Upload the local file qicriskcalc.qicData.realEstate
    const [job] = await this.bigquery
      .dataset('qicData')
      .table('realEstate')
      .load('data.csv', metadata);
  }
  // await this.bigquery.dataset(this.datasetId).createTableI(this.tableId, {
  //   schema: [
  //     { name: 'year', type: 'STRING' },
  //     { name: 'type_of_violation', type: 'STRING' },
  //     { name: 'no_of_violations', type: 'INTEGER' },
  //   ],
  // });

  async loadRealEstateDataToBQ2() {
    await this.bigquery.dataset('').createTable('', {
      schema: [
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
        { name: 'geo_point_2d', type: 'RECORD' },
      ],
    });
    // await this.bigquery
    //   .dataset(this.datasetId)
    //   .table(this.tableId)
    //   .insert(rows);

    //Date of Contract;Municipality Name;اسم البلدية;Zone Name;اسم المنطقة;Real Estate Type;نوع العقار;Area in Square Meters;Price per Square Foot;Real Estate Value;geo_point_2d
    // console.log('ingesting 2');
    // // Upload the local file qicriskcalc.qicData.realEstate
    // const [job] = await this.bigquery
    //   .dataset('qicData')
    //   .table('realEstate')
    //   .load('data.csv', metadata);
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

    const options = {
      skipInvalidRows: true,
      ignoreUnknownValues: true,
      schema: [
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
      ],
    };

    await this.bigquery.dataset('qicData').createTable('realEstate2', {
      schema: [
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
      ],
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
