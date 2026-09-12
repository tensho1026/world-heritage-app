import { randomUUID } from 'node:crypto';
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * Select a row using the primary-key index as a circular random lookup.
 * UUID primary keys are uniformly distributed, so a random UUID can be used
 * as the starting point without sorting every candidate by RANDOM().
 */
export async function selectRandomByUuid<T extends ObjectLiteral>(
  createQuery: () => SelectQueryBuilder<T>,
  exclude?: string,
) {
  const findFrom = async (anchor?: string, withExclude = true) => {
    const query = createQuery();
    if (withExclude && exclude) {
      query.andWhere('site.uuid != :exclude', { exclude });
    }
    if (anchor) {
      query.andWhere('site.uuid >= :randomAnchor', {
        randomAnchor: anchor,
      });
    }
    return query.orderBy('site.uuid', 'ASC').limit(1).getOne();
  };

  const randomAnchor = randomUUID();
  const site = await findFrom(randomAnchor);
  if (site) return site;

  // Wrap around to the first candidate when the random anchor is after the
  // largest matching UUID.
  const wrappedSite = await findFrom();
  if (wrappedSite || !exclude) return wrappedSite;

  // The excluded row may be the only candidate in a mode or filter.
  return findFrom(randomUUID(), false);
}
