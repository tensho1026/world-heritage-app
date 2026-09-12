import { selectRandomByUuid } from './random-selection';

function randomQuery(result: object | null) {
  return {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  };
}

describe('selectRandomByUuid', () => {
  it('uses an indexed UUID range instead of random sorting', async () => {
    const query = randomQuery({ uuid: 'site-1' });

    await expect(selectRandomByUuid(() => query as never)).resolves.toEqual({
      uuid: 'site-1',
    });

    expect(query.orderBy).toHaveBeenCalledWith('site.uuid', 'ASC');
    expect(query.limit).toHaveBeenCalledWith(1);
    expect(query.orderBy).not.toHaveBeenCalledWith('RANDOM()');
  });

  it('falls back to the excluded row when it is the only candidate', async () => {
    const excludedQuery = randomQuery(null);
    const wrappedQuery = randomQuery(null);
    const fallbackQuery = randomQuery({ uuid: 'only-site' });
    const queries = [excludedQuery, wrappedQuery, fallbackQuery];

    await expect(
      selectRandomByUuid(() => queries.shift() as never, 'only-site'),
    ).resolves.toEqual({ uuid: 'only-site' });

    expect(excludedQuery.andWhere).toHaveBeenCalledWith(
      'site.uuid != :exclude',
      { exclude: 'only-site' },
    );
    expect(wrappedQuery.andWhere).toHaveBeenCalledWith(
      'site.uuid != :exclude',
      { exclude: 'only-site' },
    );
    expect(fallbackQuery.andWhere).not.toHaveBeenCalledWith(
      'site.uuid != :exclude',
      { exclude: 'only-site' },
    );
  });
});
