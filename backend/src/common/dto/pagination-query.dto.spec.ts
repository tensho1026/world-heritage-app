import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto, paginated } from './pagination-query.dto';

describe('PaginationQueryDto', () => {
  it('transforms valid query strings and rejects oversized pages', async () => {
    const valid = plainToInstance(PaginationQueryDto, {
      page: '2',
      pageSize: '50',
    });
    expect(await validate(valid)).toHaveLength(0);
    expect(valid).toMatchObject({ page: 2, pageSize: 50 });

    const invalid = plainToInstance(PaginationQueryDto, {
      page: '0',
      pageSize: '51',
    });
    expect(await validate(invalid)).toHaveLength(2);
  });

  it('reports total pages and next-page availability', () => {
    expect(paginated(['item'], 41, 2, 20)).toEqual({
      items: ['item'],
      total: 41,
      page: 2,
      pageSize: 20,
      totalPages: 3,
      hasNextPage: true,
    });
  });
});
