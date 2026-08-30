import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import {
  getHeritage,
  getLearningState,
  getRandomHeritage,
  recordHeritageRead,
  recordHeritageView,
  undoHeritageRead,
  updateComprehension,
  updateFavorite,
  updateReadLater,
} from '../api/heritage'
import { getHighlights } from '../api/highlights'
import { translateArticleWithDeepL } from '../api/translations'
import { AppShell } from '../components/AppShell'
import { PageError } from '../components/AsyncState'
// import { SpeechControls } from '../components/SpeechControls'
import { HighlightCapture } from '../components/HighlightCapture'
import { HighlightsPanel } from '../components/HighlightsPanel'
import { ReadingQuiz } from '../components/ReadingQuiz'
// import { ShadowingMode } from '../components/ShadowingMode'
// import { DictationPractice } from '../components/DictationPractice'
import { WritingChallenge } from '../components/WritingChallenge'
import {
  SelectableText,
  VocabularyCapture,
} from '../components/VocabularyCapture'
import { buildChatGptTranslationUrl } from '../lib/chatgpt'
import type {
  ArticleTranslation,
  ArticleHighlight,
  ComprehensionLevel,
  HeritageMode,
  LearningState,
  WorldHeritageSite,
} from '../types'

const comprehensionOptions: Array<{
  value: ComprehensionLevel
  label: string
  symbol: string
}> = [
  { value: 'difficult', label: '難しかった', symbol: '△' },
  { value: 'partial', label: 'だいたい分かった', symbol: '○' },
  { value: 'understood', label: 'よく分かった', symbol: '◎' },
]

const heritageCriteriaGuide = [
  {
    code: 'i',
    meaning: '人類の創造的才能を示す傑作',
    example: 'タージ・マハルの建築美など',
  },
  {
    code: 'ii',
    meaning: '建築、技術、都市計画などにおける人類の価値観の交流',
    example: '歴史都市イスタンブールに見られる文化交流など',
  },
  {
    code: 'iii',
    meaning: '現存または消滅した文化や文明を伝える独自の証拠',
    example: 'ポンペイの遺跡が古代ローマの生活を伝えることなど',
  },
  {
    code: 'iv',
    meaning: '人類史の重要な段階を示す建築・技術・景観の優れた例',
    example: 'ローマのコロッセオなどの古代公共建築',
  },
  {
    code: 'v',
    meaning: '文化を代表する伝統的な集落、土地利用、海域利用',
    example: 'フィリピン・コルディリェーラの棚田など',
  },
  {
    code: 'vi',
    meaning: '重要な出来事、伝統、思想、信仰、芸術作品との強い関連',
    example: '広島平和記念碑（原爆ドーム）と平和への思想など',
  },
  {
    code: 'vii',
    meaning: 'ひときわ優れた自然現象や自然美をもつ地域',
    example: 'グランド・キャニオンの壮大な景観など',
  },
  {
    code: 'viii',
    meaning: '地球の歴史や地形形成の進行を示す優れた例',
    example: 'グランド・キャニオンの地層と侵食地形など',
  },
  {
    code: 'ix',
    meaning: '生態系や動植物群集の進化に関わる重要な進行過程',
    example: 'ガラパゴス諸島で観察できる進化と生態系など',
  },
  {
    code: 'x',
    meaning: '絶滅危惧種を含む生物多様性保全上の重要な生息地',
    example: 'ガラパゴス諸島に暮らす固有種の生息地など',
  },
] as const

export default function RandomHeritagePage() {
  const { id: routeId } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mode, setModeState] = useState<HeritageMode>(() => {
    if (searchParams.get('mode') === 'famous') return 'famous'
    return window.localStorage.getItem('heritage-mode') === 'famous'
      ? 'famous'
      : 'all'
  })
  const [randomSequence, setRandomSequence] = useState(0)
  const [previousId, setPreviousId] = useState<string>()
  const [translationDisplay, setTranslationDisplay] = useState<{
    siteId: string
    source: 'database' | 'deepl'
  } | null>(null)
  const [captureMode, setCaptureMode] = useState(false)
  const [highlightMode, setHighlightMode] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [readNotice, setReadNotice] = useState<number | null>(null)
  const viewedIdRef = useRef<string | undefined>(undefined)

  const heritageQuery = useQuery({
    queryKey: routeId
      ? ['heritage', routeId]
      : ['heritage', 'random', mode, randomSequence],
    queryFn: () =>
      routeId ? getHeritage(routeId) : getRandomHeritage(mode, previousId),
    staleTime: routeId ? 60_000 : 0,
  })
  const site = heritageQuery.data
  const deepLTranslationQuery = useQuery({
    queryKey: ['article-translation', 'deepl', site?.uuid],
    queryFn: () => translateArticleWithDeepL(site!.uuid),
    enabled: false,
    retry: false,
  })
  const learningQuery = useQuery({
    queryKey: ['learning-state', site?.uuid],
    queryFn: () => getLearningState(site!.uuid),
    enabled: Boolean(site),
  })
  const highlightsQuery = useQuery({
    queryKey: ['highlights', site?.uuid],
    queryFn: () => getHighlights(site!.uuid),
    enabled: Boolean(site),
  })
  const activeTranslationSource =
    translationDisplay && translationDisplay.siteId === site?.uuid
      ? translationDisplay.source
      : null
  const showTranslation = activeTranslationSource === 'database'
  const showDeepLTranslation = activeTranslationSource === 'deepl'

  useEffect(() => {
    if (!site || viewedIdRef.current === site.uuid) return
    viewedIdRef.current = site.uuid
    // This write is useful for stats, but it is not part of the article's
    // critical rendering path. Let the hero and first content paint first.
    window.setTimeout(() => {
      void recordHeritageView(site.uuid)
        .then(() => queryClient.invalidateQueries({ queryKey: ['stats'] }))
        .catch(() => undefined)
    }, 250)
  }, [queryClient, site])

  useEffect(() => {
    if (readNotice === null) return
    const timeout = window.setTimeout(() => setReadNotice(null), 30_000)
    return () => window.clearTimeout(timeout)
  }, [readNotice])

  const learningMutation = useMutation({
    mutationFn: (operation: () => Promise<LearningState>) => operation(),
    onSuccess: (data) => {
      queryClient.setQueryData<LearningState>(
        ['learning-state', data.heritageSiteId],
        (current) => ({ ...data, readCount: current?.readCount }),
      )
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
      void queryClient.invalidateQueries({ queryKey: ['read-later'] })
    },
  })
  const readMutation = useMutation({
    mutationFn: () => recordHeritageRead(site!.uuid),
    onSuccess: (record) => {
      setReadNotice(record.id)
      queryClient.setQueryData<LearningState>(
        ['learning-state', site!.uuid],
        (current) =>
          current
            ? {
                ...current,
                isReadLater: false,
                readCount: (current.readCount ?? 0) + 1,
              }
            : current,
      )
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      void queryClient.invalidateQueries({ queryKey: ['read-later'] })
      void queryClient.invalidateQueries({
        queryKey: ['learning-state', site!.uuid],
      })
    },
  })
  const undoMutation = useMutation({
    mutationFn: (readId: number) => undoHeritageRead(site!.uuid, readId),
    onSuccess: () => {
      setReadNotice(null)
      void queryClient.invalidateQueries({ queryKey: ['stats'] })
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      void queryClient.invalidateQueries({
        queryKey: ['learning-state', site!.uuid],
      })
    },
  })

  function changeMode(nextMode: HeritageMode) {
    window.localStorage.setItem('heritage-mode', nextMode)
    setModeState(nextMode)
    setSearchParams(nextMode === 'famous' ? { mode: 'famous' } : {})
    setPreviousId(site?.uuid)
    setRandomSequence((value) => value + 1)
  }

  function showNext() {
    setTranslationDisplay(null)
    setCaptureMode(false)
    setHighlightMode(false)
    setImageFailed(false)
    setReadNotice(null)
    if (routeId) {
      navigate(`/random-heritage${mode === 'famous' ? '?mode=famous' : ''}`)
      return
    }
    setPreviousId(site?.uuid)
    setRandomSequence((value) => value + 1)
  }

  function toggleTranslation() {
    if (!site) return
    setTranslationDisplay((current) =>
      current?.siteId === site.uuid && current.source === 'database'
        ? null
        : { siteId: site.uuid, source: 'database' },
    )
  }

  async function toggleDeepLTranslation() {
    if (showDeepLTranslation) {
      setTranslationDisplay(null)
      return
    }
    const result = deepLTranslationQuery.data
      ? { data: deepLTranslationQuery.data }
      : await deepLTranslationQuery.refetch()
    if (result.data) {
      setTranslationDisplay({ siteId: site!.uuid, source: 'deepl' })
    }
  }

  if (heritageQuery.isPending) {
    return (
      <AppShell>
        <ReaderSkeleton />
      </AppShell>
    )
  }
  if (heritageQuery.isError || !site) {
    return (
      <AppShell>
        <PageError
          message={getApiErrorMessage(heritageQuery.error)}
          onRetry={() => heritageQuery.refetch()}
        />
      </AppShell>
    )
  }

  const learning = learningQuery.data
  const storedTranslation: ArticleTranslation = {
    nameEn: site.nameJa ?? undefined,
    shortDescriptionEn: site.shortDescriptionJa ?? undefined,
    descriptionEn: site.descriptionJa ?? undefined,
    justificationEn: site.justificationJa ?? undefined,
    criteriaText: site.criteriaTextJa ?? undefined,
    mainImageCaptionEn: site.mainImageCaptionJa ?? undefined,
  }
  const translation = showDeepLTranslation
    ? deepLTranslationQuery.data
    : storedTranslation
  const showArticleTranslation = showTranslation || showDeepLTranslation
  const imageUrl = site.wikipediaImageUrl ?? site.mainImageUrl
  const imageSourceUrl = site.wikipediaImageUrl
    ? site.wikipediaPageUrl
    : site.mainImageSourceUrl
  const criteria = [...site.culturalCriteria, ...site.naturalCriteria]
  const highlights = highlightsQuery.data ?? []
  const highlightsFor = (sectionKey: string) =>
    highlights.filter((highlight) => highlight.sectionKey === sectionKey)
  const displayShortDescription = site.shortDescriptionEn
  const displayDescription = site.descriptionEn
  const displayJustification = site.justificationEn
  const displayCriteria = site.criteriaText
  // 音声機能を再開する場合は、以下の speechText と表示箇所を戻す。
  // const speechText = [
  //   site.nameEn,
  //   displayShortDescription,
  //   displayDescription,
  //   displayJustification,
  // ]
  //   .filter(Boolean)
  //   .join('. ')

  return (
    <AppShell>
      <section className="mx-auto w-[min(1240px,calc(100%-48px))] py-10 max-[760px]:w-[min(100%-32px,720px)]">
        {!routeId && <ModeSelector mode={mode} onChange={changeMode} />}

        <div className="grid grid-cols-[minmax(320px,0.82fr)_minmax(0,1fr)] items-center gap-[clamp(48px,7vw,100px)] max-[900px]:grid-cols-1">
          <figure className="m-0">
            <div className="aspect-[4/5] overflow-hidden bg-[#d9d0bd] shadow-[0_24px_55px_rgb(32_48_43_/_18%)]">
              {imageUrl && !imageFailed ? (
                <img
                  className="size-full object-cover"
                  decoding="async"
                  fetchPriority="high"
                  src={imageUrl}
                  alt={site.mainImageCaptionEn ?? site.nameEn}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <ImagePlaceholder />
              )}
            </div>
            <figcaption className="mt-3 text-right text-[0.62rem] leading-5 text-[#18352f]/50">
              {site.mainImageCaptionEn && (
                <span>{site.mainImageCaptionEn} </span>
              )}
              {site.mainImageAuthor && (
                <span>Photo: {site.mainImageAuthor} </span>
              )}
              {!site.mainImageAuthor && site.wikipediaImageAuthor && (
                <span>Photo: {site.wikipediaImageAuthor} </span>
              )}
              {(site.mainImageLicense || site.wikipediaImageLicense) && (
                <span>
                  {site.mainImageLicense ?? site.wikipediaImageLicense}{' '}
                </span>
              )}
              {imageSourceUrl && (
                <a
                  className="underline hover:text-[#b85635]"
                  href={imageSourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Source
                </a>
              )}
              {showArticleTranslation && translation?.mainImageCaptionEn && (
                <span className="mt-1 block text-[#b85635]">
                  {translation.mainImageCaptionEn}
                </span>
              )}
            </figcaption>
          </figure>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-[#18352f]/25 px-3 py-1.5 text-[0.65rem] font-bold">
                {categoryLabel(site.category)}
              </span>
              <span className="text-[0.58rem] font-bold tracking-[0.14em] text-[#18352f]/45">
                UNESCO ID {site.unescoId}
              </span>
            </div>
            <p className="mt-10 text-[0.68rem] font-extrabold tracking-[0.17em] text-[#b85635] uppercase">
              {showTranslation && site.regionJa
                ? site.regionJa
                : (site.region ?? 'WORLD')}{' '}
              ·{' '}
              {showTranslation && site.statesNamesJa.length
                ? site.statesNamesJa.join(' / ')
                : site.statesNames.join(' / ')}
            </p>
            <HighlightCapture
              enabled={highlightMode}
              heritageName={site.nameEn}
              heritageSiteId={site.uuid}
            >
              <VocabularyCapture
                enabled={captureMode}
                heritageSiteId={site.uuid}
              >
                <h1 className="mt-4 font-serif text-[clamp(2.7rem,5vw,4.8rem)] leading-[1.08] font-medium tracking-[-0.04em]">
                  <SelectableText
                    as="span"
                    highlights={highlightsFor('title')}
                    sectionKey="title"
                    text={site.nameEn}
                    sectionType="title"
                  />
                </h1>
              </VocabularyCapture>
            </HighlightCapture>
            {showArticleTranslation && translation?.nameEn && (
              <p className="mt-3 font-serif text-xl text-[#b85635]">
                {translation.nameEn}
              </p>
            )}
            {displayShortDescription && (
              <HighlightCapture
                enabled={highlightMode}
                heritageName={site.nameEn}
                heritageSiteId={site.uuid}
              >
                <VocabularyCapture
                  enabled={captureMode}
                  heritageSiteId={site.uuid}
                >
                  <SelectableText
                    className="mt-7 text-base leading-8 text-[#18352f]/72"
                    highlights={highlightsFor('short-description')}
                    sectionKey="short-description"
                    text={displayShortDescription}
                    sectionType="short-description"
                  />
                </VocabularyCapture>
              </HighlightCapture>
            )}
            {showArticleTranslation && translation?.shortDescriptionEn && (
              <JapaneseTranslation text={translation.shortDescriptionEn} />
            )}
            <Facts site={site} criteria={criteria} />
          </div>
        </div>

        <ActionBar
          captureMode={captureMode}
          highlightMode={highlightMode}
          learning={learning}
          site={site}
          showTranslation={showTranslation}
          showDeepLTranslation={showDeepLTranslation}
          translatingWithDeepL={deepLTranslationQuery.isFetching}
          onCapture={() => {
            setCaptureMode((value) => !value)
            setHighlightMode(false)
          }}
          onHighlight={() => {
            setHighlightMode((value) => !value)
            setCaptureMode(false)
          }}
          onFavorite={() =>
            learningMutation.mutate(() =>
              updateFavorite(site.uuid, !learning?.isFavorite),
            )
          }
          onReadLater={() =>
            learningMutation.mutate(() =>
              updateReadLater(site.uuid, !learning?.isReadLater),
            )
          }
          onTranslate={toggleTranslation}
          onTranslateWithDeepL={() => void toggleDeepLTranslation()}
        />
        {deepLTranslationQuery.isError && (
          <p className="mt-3 text-xs text-[#b85635]">
            {getApiErrorMessage(deepLTranslationQuery.error)}
          </p>
        )}
        <section className="grid grid-cols-[minmax(0,1fr)_330px] gap-[clamp(50px,8vw,120px)] py-16 max-[900px]:grid-cols-1">
          <article id="about-site">
            <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-[#b85635] uppercase">
              ABOUT THE SITE
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2rem,3vw,3rem)]">
              Read the story in English.
            </h2>
            {/* 音声読み上げ・シャドーイング・ディクテーションは現在無効。
            <div className="mt-7">
              <SpeechControls text={speechText} />
            </div>
            <ShadowingMode text={speechText} />
            <DictationPractice
              heritageSiteId={site.uuid}
              text={site.shortDescriptionEn ?? site.descriptionEn ?? ''}
              onLoadTranslation={async () =>
                site.shortDescriptionJa ?? site.descriptionJa ?? undefined
              }
            />
            */}
            <WritingChallenge
              heritageSiteId={site.uuid}
              text={site.shortDescriptionEn ?? site.descriptionEn ?? ''}
              onLoadTranslation={async () =>
                site.shortDescriptionJa ?? site.descriptionJa ?? undefined
              }
            />
            <HighlightCapture
              enabled={highlightMode}
              heritageName={site.nameEn}
              heritageSiteId={site.uuid}
            >
              <VocabularyCapture
                enabled={captureMode}
                heritageSiteId={site.uuid}
              >
                <div className="mt-9 space-y-6">
                  {paragraphs(displayDescription).map((paragraph, index) => {
                    const sectionKey = `description-${index}`
                    return (
                      <SelectableText
                        className="text-[1.02rem] leading-[2.05] text-[#18352f]/78"
                        highlights={highlightsFor(sectionKey)}
                        key={sectionKey}
                        sectionKey={sectionKey}
                        text={paragraph}
                        sectionType="description"
                      />
                    )
                  })}
                  {showArticleTranslation && translation?.descriptionEn && (
                    <JapaneseTranslation text={translation.descriptionEn} />
                  )}
                </div>
                {displayJustification && (
                  <div className="mt-12 border-l-2 border-[#c98c47] pl-6">
                    <h3 className="font-serif text-xl">Why it was inscribed</h3>
                    <SelectableText
                      className="mt-4 text-sm leading-7 text-[#18352f]/70"
                      highlights={highlightsFor('justification')}
                      sectionKey="justification"
                      text={displayJustification}
                      sectionType="justification"
                    />
                    {showArticleTranslation && translation?.justificationEn && (
                      <JapaneseTranslation text={translation.justificationEn} />
                    )}
                  </div>
                )}
              </VocabularyCapture>
            </HighlightCapture>
          </article>

          <ReaderSidebar
            captureMode={captureMode}
            highlightMode={highlightMode}
            highlights={highlights}
            learning={learning}
            mutationPending={learningMutation.isPending}
            site={site}
            showTranslation={showArticleTranslation}
            showDatabaseTranslation={showTranslation}
            translation={translation}
            displayCriteria={displayCriteria}
            onComprehension={(value) =>
              learningMutation.mutate(() =>
                updateComprehension(site.uuid, value),
              )
            }
          />
        </section>

        <AdditionalMedia site={site} />

        <HeritageVideo site={site} />

        <ReadingQuiz heritageName={site.nameEn} heritageSiteId={site.uuid} />

        <section className="flex flex-wrap items-center justify-between gap-5 border-t border-[#18352f]/15 py-10">
          <div>
            <p className="text-xs font-bold">読み終わったら記録しましょう</p>
            <p className="mt-1 text-xs text-[#18352f]/50">
              同じ世界遺産の再読も回数に含まれます。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="border border-[#b85635] bg-[#b85635] px-6 py-3 text-xs font-bold text-white disabled:opacity-50"
              disabled={readMutation.isPending}
              onClick={() => readMutation.mutate()}
              type="button"
            >
              {readMutation.isPending
                ? '記録中…'
                : learning?.readCount
                  ? 'もう一度読了として記録'
                  : '読了にする'}
            </button>
            <button
              className="border border-[#18352f] bg-[#18352f] px-6 py-3 text-xs font-bold text-white"
              onClick={showNext}
              type="button"
            >
              {routeId ? 'ランダムに読む' : '次の世界遺産へ'} →
            </button>
          </div>
        </section>

        {readNotice !== null && (
          <div
            className="fixed right-5 bottom-5 z-50 flex items-center gap-4 bg-[#18352f] px-5 py-4 text-xs text-white shadow-xl"
            role="status"
          >
            読了を記録しました
            <button
              className="font-bold text-[#e7c778] underline disabled:opacity-50"
              disabled={undoMutation.isPending}
              onClick={() => undoMutation.mutate(readNotice)}
              type="button"
            >
              取り消す
            </button>
          </div>
        )}
        {(learningMutation.isError ||
          readMutation.isError ||
          undoMutation.isError) && (
          <p className="fixed right-5 bottom-5 z-50 max-w-sm bg-[#b85635] px-5 py-4 text-xs text-white shadow-xl">
            {getApiErrorMessage(
              learningMutation.error ??
                readMutation.error ??
                undoMutation.error,
            )}
          </p>
        )}
        <Link
          className="inline-block pb-8 text-xs font-bold text-[#18352f]/55 underline hover:text-[#b85635]"
          to="/"
        >
          ← ホームへ戻る
        </Link>
      </section>
    </AppShell>
  )
}

function ModeSelector({
  mode,
  onChange,
}: {
  mode: HeritageMode
  onChange: (mode: HeritageMode) => void
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#18352f]/15 pb-5">
      <div>
        <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
          RANDOM READING MODE
        </p>
        <p className="mt-1 text-sm text-[#18352f]/60">
          過去に読んだ世界遺産も抽選対象です
        </p>
      </div>
      <div className="inline-flex border border-[#18352f]/20 p-1">
        {(['all', 'famous'] as const).map((value) => (
          <button
            className={`px-4 py-2 text-xs font-bold ${
              mode === value ? 'bg-[#18352f] text-white' : 'text-[#18352f]/60'
            }`}
            key={value}
            onClick={() => onChange(value)}
            type="button"
          >
            {value === 'all' ? 'すべて' : '有名な世界遺産'}
          </button>
        ))}
      </div>
    </div>
  )
}

function ReaderSkeleton() {
  return (
    <section
      className="mx-auto grid min-h-[70vh] w-[min(1240px,calc(100%-48px))] animate-pulse grid-cols-2 items-center gap-20 py-14 motion-reduce:animate-none max-[800px]:grid-cols-1 max-[760px]:w-[calc(100%-32px)]"
      aria-label="次の世界遺産を探しています"
      role="status"
    >
      <div className="aspect-[4/5] bg-[#d9d0bd]/70" />
      <div>
        <div className="h-5 w-28 bg-[#d9d0bd]" />
        <div className="mt-10 h-4 w-52 bg-[#d9d0bd]" />
        <div className="mt-5 h-20 w-full bg-[#d9d0bd]/80" />
        <div className="mt-8 h-28 w-full bg-[#d9d0bd]/55" />
      </div>
    </section>
  )
}

function Facts({
  site,
  criteria,
}: {
  site: WorldHeritageSite
  criteria: string[]
}) {
  return (
    <dl className="mt-8 grid grid-cols-3 border-y border-[#18352f]/15 py-5 text-sm max-[520px]:grid-cols-1 max-[520px]:gap-4">
      <Fact label="登録年" value={site.dateInscribed?.toString() ?? '—'} />
      <Fact
        bordered
        label="登録基準"
        value={criteria.length ? criteria.map(formatCriterion).join(', ') : '—'}
      />
      <Fact
        label="面積"
        value={
          site.areaHectares ? `${site.areaHectares.toLocaleString()} ha` : '—'
        }
      />
    </dl>
  )
}

function Fact({
  label,
  value,
  bordered = false,
}: {
  label: string
  value: string
  bordered?: boolean
}) {
  return (
    <div
      className={
        bordered
          ? 'border-x border-[#18352f]/15 px-6 max-[520px]:border-0 max-[520px]:px-0'
          : 'px-6 first:pl-0 last:pr-0 max-[520px]:px-0'
      }
    >
      <dt className="text-[0.58rem] font-bold tracking-[0.12em] text-[#18352f]/45">
        {label}
      </dt>
      <dd className="mt-2 font-serif text-xl">{value}</dd>
    </div>
  )
}

function ActionBar({
  site,
  learning,
  captureMode,
  highlightMode,
  showTranslation,
  showDeepLTranslation,
  translatingWithDeepL,
  onCapture,
  onHighlight,
  onTranslate,
  onTranslateWithDeepL,
  onFavorite,
  onReadLater,
}: {
  site: WorldHeritageSite
  learning?: LearningState
  captureMode: boolean
  highlightMode: boolean
  showTranslation: boolean
  showDeepLTranslation: boolean
  translatingWithDeepL: boolean
  onCapture: () => void
  onHighlight: () => void
  onTranslate: () => void
  onTranslateWithDeepL: () => void
  onFavorite: () => void
  onReadLater: () => void
}) {
  const button = 'border px-4 py-2.5 text-xs font-bold disabled:opacity-50'
  return (
    <div className="mt-12 border-y border-[#18352f]/15 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`${button} border-[#18352f] bg-[#18352f] text-white`}
          onClick={onTranslate}
          type="button"
        >
          {showTranslation ? '英語だけに戻す' : '日本語訳を表示'}
        </button>
        <button
          className={`${button} border-[#2877b5] text-[#195f96] hover:bg-[#2877b5] hover:text-white`}
          disabled={translatingWithDeepL}
          onClick={onTranslateWithDeepL}
          type="button"
        >
          {translatingWithDeepL
            ? 'DeepLで翻訳中…'
            : showDeepLTranslation
              ? 'DeepL訳を閉じる'
              : 'DeepLで翻訳'}
        </button>
        <button
          className={`${button} ${highlightMode ? 'border-[#e7c778] bg-[#e7c778]' : 'border-[#18352f]/25'}`}
          onClick={onHighlight}
          type="button"
          aria-pressed={highlightMode}
        >
          {highlightMode ? 'ハイライトモード ON' : '英文をハイライト'}
        </button>
        <a
          className={`${button} border-[#b85635] text-[#b85635] hover:bg-[#b85635] hover:text-white`}
          href={buildChatGptTranslationUrl(site)}
          rel="noreferrer"
          target="_blank"
        >
          AIで全文翻訳 ↗
        </a>
        <button
          className={`${button} ${captureMode ? 'border-[#c98c47] bg-[#c98c47]' : 'border-[#18352f]/25'}`}
          onClick={onCapture}
          type="button"
          aria-pressed={captureMode}
        >
          {captureMode ? '単語記録モード ON' : '単語を記録する'}
        </button>
        <button
          className={`${button} ${learning?.isFavorite ? 'border-[#b85635] bg-[#b85635]/10 text-[#b85635]' : 'border-[#18352f]/25'}`}
          disabled={!learning}
          onClick={onFavorite}
          type="button"
          aria-pressed={learning?.isFavorite ?? false}
        >
          {learning?.isFavorite ? '♥ お気に入り済み' : '♡ お気に入り'}
        </button>
        <button
          className={`${button} ${learning?.isReadLater ? 'border-[#4f8871] bg-[#4f8871]/10 text-[#315f4c]' : 'border-[#18352f]/25'}`}
          disabled={!learning}
          onClick={onReadLater}
          type="button"
          aria-pressed={learning?.isReadLater ?? false}
        >
          {learning?.isReadLater ? '✓ 後で読むに保存済み' : '＋ 後で読む'}
        </button>
      </div>
      {captureMode && (
        <p className="mt-3 text-xs leading-5 text-[#18352f]/60">
          単語はクリック、句動詞や複数語はドラッグまたは長押しで選択してください。
        </p>
      )}
      {highlightMode && (
        <p className="mt-3 text-xs leading-5 text-[#18352f]/60">
          気になる英文を選択し、分からなかった理由と日本語メモを保存できます。
        </p>
      )}
    </div>
  )
}

function ReaderSidebar({
  site,
  learning,
  captureMode,
  highlightMode,
  highlights,
  showTranslation,
  showDatabaseTranslation,
  translation,
  displayCriteria,
  mutationPending,
  onComprehension,
}: {
  site: WorldHeritageSite
  learning?: LearningState
  captureMode: boolean
  highlightMode: boolean
  highlights: ArticleHighlight[]
  showTranslation: boolean
  showDatabaseTranslation: boolean
  translation?: ArticleTranslation
  displayCriteria: string | null
  mutationPending: boolean
  onComprehension: (value: ComprehensionLevel) => void
}) {
  const [showMap, setShowMap] = useState(false)

  return (
    <aside className="space-y-9 border-l border-[#18352f]/15 pl-9 max-[900px]:border-0 max-[900px]:pl-0">
      <div>
        <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
          UNDERSTANDING
        </p>
        <p className="mt-2 text-xs text-[#18352f]/55">
          今回の記事の理解度を記録
        </p>
        <div className="mt-4 grid gap-2">
          {comprehensionOptions.map((option) => (
            <button
              className={`flex items-center justify-between border px-4 py-3 text-left text-xs font-bold ${learning?.comprehensionLevel === option.value ? 'border-[#b85635] bg-[#b85635]/8 text-[#b85635]' : 'border-[#18352f]/20'}`}
              disabled={!learning || mutationPending}
              key={option.value}
              onClick={() => onComprehension(option.value)}
              type="button"
            >
              {option.label} <span>{option.symbol}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
          LOCATION
        </p>
        <p className="mt-3 font-serif text-xl leading-8">
          {coordinate(site.latitude, 'N', 'S')}
          <br />
          {coordinate(site.longitude, 'E', 'W')}
        </p>
        {site.latitude !== null && site.longitude !== null && (
          <div className="mt-4 overflow-hidden border border-[#18352f]/15 bg-[#e3dccd]">
            {showMap ? (
              <>
                <iframe
                  className="h-44 w-full"
                  src={openStreetMapEmbedUrl(site.latitude, site.longitude)}
                  title={`${site.nameEn}の地図`}
                />
                <a
                  className="block px-3 py-2 text-[0.6rem] text-[#18352f]/55 underline"
                  href={`https://www.openstreetmap.org/?mlat=${site.latitude}&mlon=${site.longitude}#map=8/${site.latitude}/${site.longitude}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  OpenStreetMapで開く
                </a>
              </>
            ) : (
              <button
                className="h-44 w-full text-xs font-bold text-[#18352f]/65 hover:text-[#b85635]"
                onClick={() => setShowMap(true)}
                type="button"
              >
                地図を読み込む
              </button>
            )}
          </div>
        )}
      </div>
      {displayCriteria && (
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
              HERITAGE CRITERIA
            </p>
            <CriteriaHelp site={site} />
          </div>
          <HighlightCapture
            enabled={highlightMode}
            heritageName={site.nameEn}
            heritageSiteId={site.uuid}
          >
            <VocabularyCapture enabled={captureMode} heritageSiteId={site.uuid}>
              <SelectableText
                className="mt-3 text-xs leading-6 text-[#18352f]/65"
                highlights={highlights.filter(
                  (highlight) => highlight.sectionKey === 'criteria',
                )}
                sectionKey="criteria"
                text={displayCriteria}
                sectionType="criteria"
              />
            </VocabularyCapture>
          </HighlightCapture>
          {showTranslation && translation?.criteriaText && (
            <JapaneseTranslation text={translation.criteriaText} />
          )}
        </div>
      )}
      <div>
        <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
          HIGHLIGHTS & NOTES
        </p>
        <div className="mt-4">
          <HighlightsPanel heritageSiteId={site.uuid} highlights={highlights} />
        </div>
      </div>
      {site.danger && (
        <div className="border border-[#b85635]/35 bg-[#b85635]/6 p-4">
          <p className="text-xs font-bold text-[#b85635]">
            危機遺産リスト掲載中
          </p>
          {site.dangerList && (
            <p className="mt-2 text-xs leading-5 text-[#18352f]/60">
              {showDatabaseTranslation && site.dangerListJa
                ? site.dangerListJa
                : site.dangerList}
            </p>
          )}
        </div>
      )}
    </aside>
  )
}

function CriteriaHelp({ site }: { site: WorldHeritageSite }) {
  const [open, setOpen] = useState(false)
  const activeCriteria = new Set(
    [...site.culturalCriteria, ...site.naturalCriteria].map(criterionCode),
  )

  return (
    <div className="relative">
      <button
        aria-controls="heritage-criteria-help"
        aria-expanded={open}
        aria-label="世界遺産の登録基準の説明を表示"
        className="grid size-6 place-items-center rounded-full border border-[#b85635]/45 text-xs font-bold text-[#b85635] transition-colors hover:bg-[#b85635]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b85635]"
        onClick={() => setOpen((current) => !current)}
        title="登録基準と具体例を見る"
        type="button"
      >
        ?
      </button>
      {open && (
        <div
          className="absolute top-8 right-0 z-20 w-[min(34rem,calc(100vw-3rem))] border border-[#18352f]/15 bg-[#f8f3e9] p-5 shadow-[0_18px_45px_rgb(32_48_43_/_18%)] max-[900px]:fixed max-[900px]:top-20 max-[900px]:right-6 max-[900px]:left-6 max-[900px]:w-auto"
          id="heritage-criteria-help"
          role="region"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-serif text-lg">世界遺産の登録基準とは？</p>
              <p className="mt-2 text-xs leading-5 text-[#18352f]/65">
                UNESCOが「顕著な普遍的価値」を判断する10の基準です。
                登録には少なくとも1つを満たす必要があり、(i)〜(vi)は文化、
                (vii)〜(x)は自然の価値を示します。
              </p>
            </div>
            <button
              aria-label="登録基準の説明を閉じる"
              className="text-lg leading-none text-[#18352f]/45 hover:text-[#18352f]"
              onClick={() => setOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>
          <ul className="mt-4 max-h-[min(28rem,65vh)] space-y-2 overflow-y-auto pr-1">
            {heritageCriteriaGuide.map((criterion) => {
              const active = activeCriteria.has(criterion.code)
              return (
                <li
                  className={`border p-3 ${active ? 'border-[#b85635]/45 bg-[#b85635]/8' : 'border-[#18352f]/10 bg-white/40'}`}
                  key={criterion.code}
                >
                  <p className="text-xs font-bold text-[#18352f]">
                    ({criterion.code}) {criterion.meaning}
                    {active && (
                      <span className="ml-2 text-[0.58rem] text-[#b85635]">
                        この遺産に該当
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[0.68rem] leading-5 text-[#18352f]/60">
                    例：{criterion.example}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function AdditionalMedia({ site }: { site: WorldHeritageSite }) {
  const excluded = new Set(
    [site.mainImageUrl, site.wikipediaImageUrl].filter(Boolean),
  )
  const images = [...new Set(site.imageUrls)].filter(
    (url) => url && !excluded.has(url),
  )
  if (!images.length) return null

  return <DeferredGallery images={images} siteName={site.nameEn} />
}

function DeferredGallery({ images, siteName }: { images: string[]; siteName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="border-t border-[#18352f]/15 py-12">
      <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
        IMAGE GALLERY
      </p>
      <button
        aria-expanded={open}
        className="mt-3 font-serif text-left text-3xl hover:text-[#b85635]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        More views {open ? '−' : '+'}
      </button>
      {open && (
        <div className="mt-6 grid grid-cols-3 gap-4 max-[720px]:grid-cols-2 max-[480px]:grid-cols-1">
          {images.slice(0, 9).map((url) => (
            <MediaImage key={url} siteName={siteName} url={url} />
          ))}
        </div>
      )}
    </section>
  )
}

function HeritageVideo({ site }: { site: WorldHeritageSite }) {
  const [active, setActive] = useState(false)
  const videoUrl = site.mainVideoUrl ?? site.videoUrls[0]
  if (!videoUrl) return null
  const youtubeEmbedUrl = trustedYouTubeEmbedUrl(videoUrl)

  return (
    <section className="border-t border-[#18352f]/15 py-12">
      <h2 className="font-serif text-2xl">Related video</h2>
      {youtubeEmbedUrl ? (
        active ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="mt-5 aspect-video w-full bg-black"
            referrerPolicy="strict-origin-when-cross-origin"
            src={youtubeEmbedUrl}
            title={`${site.nameEn}の関連動画`}
          />
        ) : (
          <button
            className="mt-5 flex aspect-video w-full items-center justify-center bg-[#18352f] text-sm font-bold text-white hover:bg-[#315f4c]"
            onClick={() => setActive(true)}
            type="button"
          >
            関連動画を読み込む
          </button>
        )
      ) : (
        <video
          className="mt-5 max-h-[620px] w-full bg-black"
          controls
          preload="none"
          src={videoUrl}
        />
      )}
    </section>
  )
}

function trustedYouTubeEmbedUrl(value: string) {
  try {
    const url = new URL(value)
    const trustedHost =
      url.hostname === 'www.youtube-nocookie.com' ||
      url.hostname === 'www.youtube.com' ||
      url.hostname === 'youtube.com'
    return trustedHost && url.pathname.startsWith('/embed/')
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function MediaImage({ url, siteName }: { url: string; siteName: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <a
      className="block aspect-[4/3] overflow-hidden bg-[#d9d0bd] focus-visible:outline-3 focus-visible:outline-[#b85635]"
      href={url}
      rel="noreferrer"
      target="_blank"
    >
      <img
        className="size-full object-cover transition-transform duration-300 hover:scale-[1.02]"
        src={url}
        alt={`${siteName}の追加画像`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </a>
  )
}

function JapaneseTranslation({ text }: { text: string }) {
  return (
    <div className="mt-4 border-l-2 border-[#b85635]/45 bg-white/45 px-5 py-4">
      <p className="mb-2 text-[0.58rem] font-bold tracking-[0.14em] text-[#b85635]">
        日本語訳
      </p>
      {paragraphs(text).map((paragraph, index) => (
        <p className="mt-2 text-sm leading-7 text-[#18352f]/72" key={index}>
          {paragraph}
        </p>
      ))}
    </div>
  )
}

function ImagePlaceholder() {
  return (
    <div className="grid size-full place-items-center bg-[linear-gradient(145deg,#d9d0bd,#8aa098)] text-center text-white/80">
      <div>
        <span className="block text-5xl">◇</span>
        <span className="mt-3 block text-xs tracking-[0.14em]">
          IMAGE UNAVAILABLE
        </span>
      </div>
    </div>
  )
}

function paragraphs(text: string | null) {
  return text
    ? text
        .split(/\n\s*\n/)
        .map((value) => value.trim())
        .filter(Boolean)
    : []
}

function categoryLabel(category: WorldHeritageSite['category']) {
  return { Cultural: '文化遺産', Natural: '自然遺産', Mixed: '複合遺産' }[
    category
  ]
}

function formatCriterion(value: string) {
  return `(${criterionCode(value)})`
}

function criterionCode(value: string) {
  const number = Number(value.replace(/^[cn]/, ''))
  return heritageCriteriaGuide[number - 1]?.code ?? value
}

function coordinate(value: number | null, positive: string, negative: string) {
  return value === null
    ? '—'
    : `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`
}

function openStreetMapEmbedUrl(latitude: number, longitude: number) {
  const delta = 0.35
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude}%2C${longitude}`
}
