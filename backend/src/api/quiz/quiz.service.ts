import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity';
import { WorldHeritageSite } from '../../database/entities/world-heritage-site.entity';

export type QuizQuestion = {
  id: string;
  type: 'multiple-choice' | 'true-false';
  prompt: string;
  options: string[];
  correctAnswer: string;
  evidence: string;
};

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(WorldHeritageSite)
    private readonly heritageRepository: Repository<WorldHeritageSite>,
    @InjectRepository(QuizAttempt)
    private readonly attemptRepository: Repository<QuizAttempt>,
  ) {}

  async getQuiz(heritageSiteId: string) {
    const site = await this.heritageRepository.findOneBy({
      uuid: heritageSiteId,
    });
    if (!site)
      throw new NotFoundException('World Heritage site was not found.');
    const distractorSites = await this.heritageRepository.find({
      where: { uuid: Not(heritageSiteId) },
      order: { unescoId: 'ASC' },
      take: 20,
    });
    return {
      heritageSiteId,
      title: `Reading check: ${site.nameEn}`,
      questions: this.buildQuestions(site, distractorSites),
    };
  }

  async submit(heritageSiteId: string, answers: unknown) {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      throw new BadRequestException('Quiz answers are required.');
    }
    const quiz = await this.getQuiz(heritageSiteId);
    const submitted = answers as Record<string, unknown>;
    const results = quiz.questions.map((question) => {
      const answer =
        typeof submitted[question.id] === 'string'
          ? (submitted[question.id] as string)
          : '';
      return {
        questionId: question.id,
        answer,
        correct: answer === question.correctAnswer,
        correctAnswer: question.correctAnswer,
        evidence: question.evidence,
      };
    });
    const score = results.filter((result) => result.correct).length;
    const attempt = await this.attemptRepository.save(
      this.attemptRepository.create({
        heritageSiteId,
        score,
        total: quiz.questions.length,
        answers: results.map(({ questionId, answer, correct }) => ({
          questionId,
          answer,
          correct,
        })),
      }),
    );
    return { ...attempt, results };
  }

  async getHistory(heritageSiteId: string) {
    return this.attemptRepository.find({
      where: { heritageSiteId },
      order: { completedAt: 'DESC' },
      take: 20,
    });
  }

  private buildQuestions(
    site: WorldHeritageSite,
    distractorSites: WorldHeritageSite[],
  ): QuizQuestion[] {
    const seed = site.uuid.charCodeAt(0) + site.nameEn.length;
    const questions: QuizQuestion[] = [];
    const category = site.category;
    questions.push({
      id: 'category',
      type: 'multiple-choice',
      prompt: 'How is this property classified by UNESCO?',
      options: this.rotate(['Cultural', 'Natural', 'Mixed'], seed),
      correctAnswer: category,
      evidence: `${site.nameEn} is classified as a ${category} World Heritage property.`,
    });

    const country = site.statesNames.join(' / ') || 'Unknown';
    const otherCountries = distractorSites
      .map((item) => item.statesNames.join(' / '))
      .filter((value) => value && value !== country);
    questions.push({
      id: 'country',
      type: 'multiple-choice',
      prompt:
        'In which country or countries is this World Heritage site located?',
      options: this.options(country, otherCountries, seed + 1),
      correctAnswer: country,
      evidence: `UNESCO lists the State Party or Parties as: ${country}.`,
    });

    if (site.dateInscribed) {
      const year = String(site.dateInscribed);
      const years = [
        site.dateInscribed - 10,
        site.dateInscribed + 5,
        site.dateInscribed + 15,
      ].map(String);
      questions.push({
        id: 'year',
        type: 'multiple-choice',
        prompt:
          'When was the property first inscribed on the World Heritage List?',
        options: this.options(year, years, seed + 2),
        correctAnswer: year,
        evidence: `The inscription year recorded by UNESCO is ${year}.`,
      });
    }

    questions.push({
      id: 'danger',
      type: 'true-false',
      prompt:
        'True or false: the property is currently marked as being on the List of World Heritage in Danger.',
      options: ['True', 'False'],
      correctAnswer: site.danger ? 'True' : 'False',
      evidence: site.danger
        ? site.dangerList ||
          'UNESCO currently marks this property as in danger.'
        : 'The current UNESCO data does not mark this property as being on the danger list.',
    });

    const reason = this.snippet(
      site.justificationEn || site.criteriaText || site.shortDescriptionEn,
    );
    const otherReasons = distractorSites
      .map((item) => this.snippet(item.justificationEn || item.criteriaText))
      .filter(Boolean) as string[];
    if (reason) {
      questions.push({
        id: 'reason',
        type: 'multiple-choice',
        prompt: 'Which excerpt best matches the stated reason for inscription?',
        options: this.options(reason, otherReasons, seed + 3),
        correctAnswer: reason,
        evidence: site.justificationEn || site.criteriaText || reason,
      });
    }

    return questions.slice(0, 5);
  }

  private options(correct: string, candidates: string[], seed: number) {
    const unique = [correct, ...new Set(candidates)]
      .filter(Boolean)
      .slice(0, 4);
    return this.rotate(unique, seed);
  }

  private rotate<T>(values: T[], seed: number) {
    if (!values.length) return values;
    const offset = seed % values.length;
    return [...values.slice(offset), ...values.slice(0, offset)];
  }

  private snippet(value: string | null | undefined) {
    if (!value?.trim()) return null;
    const sentence = value.trim().split(/(?<=[.!?])\s+/)[0];
    return sentence.length > 220 ? `${sentence.slice(0, 217)}…` : sentence;
  }
}
