import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ComprehensionLevel,
  HeritageLearningState,
} from '../../database/entities/heritage-learning-state.entity';
import { HeritageRead } from '../../database/entities/heritage-read.entity';
import { HeritageView } from '../../database/entities/heritage-view.entity';
import { SavedVocabulary } from '../../database/entities/saved-vocabulary.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';
import { WikipediaMediaService } from './wikipedia-media.service';

export type HeritageMode = 'all' | 'famous';

@Injectable()
export class HeritageService {
  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
    @InjectRepository(HeritageView)
    private readonly viewRepository: Repository<HeritageView>,
    @InjectRepository(HeritageRead)
    private readonly readRepository: Repository<HeritageRead>,
    @InjectRepository(HeritageLearningState)
    private readonly learningRepository: Repository<HeritageLearningState>,
    @InjectRepository(SavedVocabulary)
    private readonly vocabularyRepository: Repository<SavedVocabulary>,
    private readonly wikipediaMediaService: WikipediaMediaService,
  ) {}

  async getRandom(mode: HeritageMode, exclude?: string) {
    const query = this.heritageRepository.createQueryBuilder('site');

    if (mode === 'famous') {
      query.andWhere('site.isFeatured = :isFeatured', { isFeatured: true });
    }

    if (exclude) {
      query.andWhere('site.uuid != :exclude', { exclude });
    }

    const site = await query.orderBy('RANDOM()').limit(1).getOne();

    if (!site) {
      throw new NotFoundException(
        'No World Heritage site matches the selected mode.',
      );
    }

    return this.wikipediaMediaService.fillMissingImage(site);
  }

  async getById(id: string) {
    const site = await this.requireSite(id);
    return this.wikipediaMediaService.fillMissingImage(site);
  }

  async recordView(heritageSiteId: string) {
    await this.requireSite(heritageSiteId);
    return this.viewRepository.save(
      this.viewRepository.create({ heritageSiteId }),
    );
  }

  async recordRead(heritageSiteId: string) {
    await this.requireSite(heritageSiteId);
    const read = await this.readRepository.save(
      this.readRepository.create({ heritageSiteId }),
    );
    const state = await this.getOrCreateLearningState(heritageSiteId);

    if (state.isReadLater) {
      state.isReadLater = false;
      await this.learningRepository.save(state);
    }

    return read;
  }

  async undoRead(heritageSiteId: string, readId: number) {
    const read = await this.readRepository.findOneBy({
      id: readId,
      heritageSiteId,
    });

    if (!read) {
      throw new NotFoundException('Read record was not found.');
    }

    if (Date.now() - read.readAt.getTime() > 30_000) {
      throw new BadRequestException(
        'Read records can only be undone for 30 seconds.',
      );
    }

    await this.readRepository.remove(read);
  }

  async getLearningState(heritageSiteId: string) {
    await this.requireSite(heritageSiteId);
    const state = await this.learningRepository.findOneBy({ heritageSiteId });
    const readCount = await this.readRepository.count({
      where: { heritageSiteId },
    });
    return { ...(state ?? this.defaultLearningState(heritageSiteId)), readCount };
  }

  async updateComprehension(
    heritageSiteId: string,
    comprehensionLevel: ComprehensionLevel | null,
  ) {
    if (
      comprehensionLevel !== null &&
      !Object.values(ComprehensionLevel).includes(comprehensionLevel)
    ) {
      throw new BadRequestException('Invalid comprehension level.');
    }

    const state = await this.getOrCreateLearningState(heritageSiteId);
    state.comprehensionLevel = comprehensionLevel;
    return this.learningRepository.save(state);
  }

  async setFavorite(heritageSiteId: string, value: boolean) {
    const state = await this.getOrCreateLearningState(heritageSiteId);
    state.isFavorite = value;
    return this.learningRepository.save(state);
  }

  async setReadLater(heritageSiteId: string, value: boolean) {
    const state = await this.getOrCreateLearningState(heritageSiteId);
    state.isReadLater = value;
    return this.learningRepository.save(state);
  }

  async getFavorites() {
    return this.getSitesForState('isFavorite');
  }

  async getReadLater() {
    return this.getSitesForState('isReadLater');
  }

  async getHistory() {
    const reads = await this.readRepository.find({
      order: { readAt: 'DESC' },
      take: 100,
    });
    const ids = [...new Set(reads.map((read) => read.heritageSiteId))];
    const sites = ids.length
      ? await this.heritageRepository.findBy({ uuid: In(ids) })
      : [];
    const siteMap = new Map(sites.map((site) => [site.uuid, site]));

    return reads.flatMap((read) => {
      const site = siteMap.get(read.heritageSiteId);
      return site ? [{ ...read, site: this.toSiteSummary(site) }] : [];
    });
  }

  async getStats() {
    const [
      totalViews,
      totalReads,
      savedVocabulary,
      memorizationVocabulary,
      uncertainVocabulary,
      savedStates,
    ] = await Promise.all([
      this.viewRepository.count(),
      this.readRepository.count(),
      this.vocabularyRepository.count(),
      this.vocabularyRepository.count({
        where: { isInMemorization: true },
      }),
      this.vocabularyRepository.count({ where: { isUncertain: true } }),
      this.learningRepository.find(),
    ]);
    const [uniqueViewed, uniqueRead, categoryRows, regionRows] =
      await Promise.all([
        this.viewRepository
          .createQueryBuilder('view')
          .select('COUNT(DISTINCT view.heritageSiteId)', 'count')
          .getRawOne<{ count: string }>(),
        this.readRepository
          .createQueryBuilder('read')
          .select('COUNT(DISTINCT read.heritageSiteId)', 'count')
          .getRawOne<{ count: string }>(),
        this.readRepository
          .createQueryBuilder('read')
          .innerJoin(
            WorldHeritageSite,
            'site',
            'site.uuid = read.heritageSiteId',
          )
          .select('site.category', 'label')
          .addSelect('COUNT(DISTINCT read.heritageSiteId)', 'count')
          .groupBy('site.category')
          .getRawMany<{ label: string; count: string }>(),
        this.readRepository
          .createQueryBuilder('read')
          .innerJoin(
            WorldHeritageSite,
            'site',
            'site.uuid = read.heritageSiteId',
          )
          .select("COALESCE(site.region, 'Unknown')", 'label')
          .addSelect('COUNT(DISTINCT read.heritageSiteId)', 'count')
          .groupBy('site.region')
          .getRawMany<{ label: string; count: string }>(),
      ]);

    const comprehension = Object.values(ComprehensionLevel).reduce(
      (counts, level) => {
        counts[level] = savedStates.filter(
          (state) => state.comprehensionLevel === level,
        ).length;
        return counts;
      },
      {} as Record<ComprehensionLevel, number>,
    );

    return {
      totalViews,
      totalReads,
      uniqueViewed: Number(uniqueViewed?.count ?? 0),
      uniqueRead: Number(uniqueRead?.count ?? 0),
      favorites: savedStates.filter((state) => state.isFavorite).length,
      readLater: savedStates.filter((state) => state.isReadLater).length,
      savedVocabulary,
      memorizationVocabulary,
      uncertainVocabulary,
      comprehension,
      byCategory: this.rowsToRecord(categoryRows),
      byRegion: this.rowsToRecord(regionRows),
    };
  }

  private async getSitesForState(field: 'isFavorite' | 'isReadLater') {
    const states = await this.learningRepository.find({
      where: { [field]: true },
      order: { updatedAt: 'DESC' },
    });
    const ids = states.map((state) => state.heritageSiteId);

    if (!ids.length) return [];

    const sites = await this.heritageRepository.findBy({ uuid: In(ids) });
    const siteMap = new Map(sites.map((site) => [site.uuid, site]));
    return states.flatMap((state) => {
      const site = siteMap.get(state.heritageSiteId);
      return site
        ? [{ ...this.toSiteSummary(site), updatedAt: state.updatedAt }]
        : [];
    });
  }

  private async getOrCreateLearningState(heritageSiteId: string) {
    await this.requireSite(heritageSiteId);
    return (
      (await this.learningRepository.findOneBy({ heritageSiteId })) ??
      this.learningRepository.create(this.defaultLearningState(heritageSiteId))
    );
  }

  private defaultLearningState(heritageSiteId: string) {
    return {
      heritageSiteId,
      comprehensionLevel: null,
      isFavorite: false,
      isReadLater: false,
    };
  }

  private async requireSite(id: string) {
    const site = await this.heritageRepository.findOneBy({ uuid: id });
    if (!site)
      throw new NotFoundException('World Heritage site was not found.');
    return site;
  }

  private toSiteSummary(site: WorldHeritageSite) {
    return {
      uuid: site.uuid,
      unescoId: site.unescoId,
      nameEn: site.nameEn,
      category: site.category,
      statesNames: site.statesNames,
      region: site.region,
      mainImageUrl: site.mainImageUrl ?? site.wikipediaImageUrl,
      dateInscribed: site.dateInscribed,
    };
  }

  private rowsToRecord(rows: { label: string; count: string }[]) {
    return Object.fromEntries(
      rows.map((row) => [row.label, Number(row.count)]),
    );
  }
}
