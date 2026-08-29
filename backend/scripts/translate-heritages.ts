import 'dotenv/config';
import { createHash } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { createDataSourceOptions } from '../src/database/typeorm.options';
import { WorldHeritageSite } from '../src/database/entities/world-heritage-site.entity';

type TextField = {
  source: keyof WorldHeritageSite;
  target: keyof WorldHeritageSite;
};

const TEXT_FIELDS: TextField[] = [
  { source: 'nameEn', target: 'nameJa' },
  { source: 'shortDescriptionEn', target: 'shortDescriptionJa' },
  { source: 'descriptionEn', target: 'descriptionJa' },
  { source: 'justificationEn', target: 'justificationJa' },
  { source: 'dangerList', target: 'dangerListJa' },
  { source: 'criteriaText', target: 'criteriaTextJa' },
  { source: 'region', target: 'regionJa' },
  { source: 'mainImageCaptionEn', target: 'mainImageCaptionJa' },
  { source: 'mainVideoCaptionEn', target: 'mainVideoCaptionJa' },
];

type LibreTranslateResponse = {
  translatedText?: string | string[];
  error?: string;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const libreTranslateUrl = (
  process.env.LIBRETRANSLATE_URL ?? 'http://127.0.0.1:5000'
).replace(/\/$/, '');
const apiKey = process.env.LIBRETRANSLATE_API_KEY;
const limit = Number(process.env.TRANSLATE_LIMIT ?? 0);
const concurrency = Math.max(1, Number(process.env.TRANSLATE_CONCURRENCY ?? 1));

const dataSource = new DataSource(createDataSourceOptions(databaseUrl, false));

function hash(value: string | string[]) {
  return createHash('sha256')
    .update(Array.isArray(value) ? JSON.stringify(value) : value)
    .digest('hex');
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

async function requestTranslations(texts: string[]): Promise<string[]> {
  if (!texts.length) return [];

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(`${libreTranslateUrl}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: texts,
          source: 'en',
          target: 'ja',
          format: 'html',
          ...(apiKey ? { api_key: apiKey } : {}),
        }),
        signal: AbortSignal.timeout(10 * 60_000),
      });
      const data = (await response
        .json()
        .catch(() => ({}))) as LibreTranslateResponse;
      if (!response.ok) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }

      const translated = Array.isArray(data.translatedText)
        ? data.translatedText
        : [data.translatedText ?? ''];
      if (
        translated.length !== texts.length ||
        translated.some((text) => !text)
      ) {
        throw new Error('LibreTranslate returned an invalid response.');
      }
      return translated;
    } catch (error) {
      if (attempt === 5) throw error;
      const delay = Math.min(30_000, 1_000 * 2 ** (attempt - 1));
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('LibreTranslate request failed.');
}

async function translateSite(
  repository: Repository<WorldHeritageSite>,
  site: WorldHeritageSite,
) {
  const hashes = { ...(site.translationSourceHashes ?? {}) };
  let changed = false;
  const pending = new Map<string, string>();
  const assignments: Array<{
    source: keyof WorldHeritageSite;
    target: keyof WorldHeritageSite;
    value: string;
    sourceHash: string;
  }> = [];

  for (const field of TEXT_FIELDS) {
    const sourceValue = site[field.source];
    if (!hasText(sourceValue)) continue;
    const sourceHash = hash(sourceValue);
    const targetValue = site[field.target];
    // UNESCO criteria are Roman-numeral identifiers such as (i)(iv)(x), not
    // prose. Machine translation can silently remove or alter identifiers.
    if (field.source === 'criteriaText') {
      if (targetValue !== sourceValue || hashes.criteriaText !== sourceHash) {
        site.criteriaTextJa = sourceValue;
        hashes.criteriaText = sourceHash;
        changed = true;
      }
      continue;
    }
    if (hashes[String(field.source)] === sourceHash && hasText(targetValue)) {
      continue;
    }
    pending.set(sourceValue, sourceValue);
    assignments.push({ ...field, value: sourceValue, sourceHash });
  }

  const statesHash = hash(site.statesNames);
  const needsStates =
    site.statesNames.length > 0 &&
    (hashes.statesNames !== statesHash ||
      site.statesNamesJa.length !== site.statesNames.length);
  if (needsStates) {
    site.statesNames.forEach((state) => pending.set(state, state));
  }

  if (pending.size) {
    const sourceTexts = [...pending.keys()];
    const translations = await requestTranslations(sourceTexts);
    const translatedBySource = new Map(
      sourceTexts.map((source, index) => [source, translations[index]]),
    );

    for (const assignment of assignments) {
      (site as unknown as Record<string, unknown>)[String(assignment.target)] =
        translatedBySource.get(assignment.value) ?? null;
      hashes[String(assignment.source)] = assignment.sourceHash;
    }
    if (needsStates) {
      site.statesNamesJa = site.statesNames.map(
        (state) => translatedBySource.get(state) ?? state,
      );
      hashes.statesNames = statesHash;
    }
    changed = true;
  }

  if (!changed) return false;
  site.translationSourceHashes = hashes;
  site.translationProvider = 'libretranslate';
  site.translatedAt = new Date();
  await repository.save(site);
  return true;
}

async function main() {
  await dataSource.initialize();
  const repository = dataSource.getRepository(WorldHeritageSite);
  const sites = await repository.find({ order: { unescoId: 'ASC' } });
  const selected = limit > 0 ? sites.slice(0, limit) : sites;
  let cursor = 0;
  let translated = 0;
  let skipped = 0;

  async function worker() {
    while (cursor < selected.length) {
      const index = cursor;
      cursor += 1;
      const site = selected[index];
      const changed = await translateSite(repository, site);
      if (changed) translated += 1;
      else skipped += 1;
      console.log(
        `[${index + 1}/${selected.length}] ${changed ? 'translated' : 'cached'} ${site.nameEn}`,
      );
    }
  }

  try {
    await Promise.all(
      Array.from({ length: Math.min(concurrency, selected.length) }, () =>
        worker(),
      ),
    );
    console.log(
      JSON.stringify({ total: selected.length, translated, skipped }, null, 2),
    );
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
