import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorldHeritageSite } from '../../../database/entities/world-heritage-site.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HeritageImportService {
  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepositry: Repository<WorldHeritageSite>,
  ) {}

  async importHeritages() {
    const res = await fetch(
      'https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records?limit=1',
    );

    const data = await res.json();
    if (data) {
      console.log(data);
    }
    if (!res.ok) {
      throw new Error('Failed to fetch UNESCO heritage data');

      // const heritages = res.result

      // return `挿入したデータの件数${res.length}件`
    }

    return data;
  }
}
