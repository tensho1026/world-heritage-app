import { queryKeys } from '../api/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import {
  getHeritage,
  getLearningState,
  getRandomHeritage,
  downloadHeritagePdf,
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
import { SpeechControls } from '../components/SpeechControls'
import { HighlightCapture } from '../components/HighlightCapture'
import { ReadingQuiz } from '../components/ReadingQuiz'
import { ShadowingMode } from '../components/ShadowingMode'
import { DictationPractice } from '../components/DictationPractice'
import { WritingChallenge } from '../components/WritingChallenge'
import {
  SelectableText,
  VocabularyCapture,
} from '../components/VocabularyCapture'
import { optimizedImageUrl } from '../lib/media'
import {
  ActionBar,
  AdditionalMedia,
  Facts,
  HeritageVideo,
  ImagePlaceholder,
  JapaneseTranslation,
  ModeSelector,
  ReaderSidebar,
  ReaderSkeleton,
} from '../components/heritage-reader/ReaderParts'
import {
  categoryLabel,
  paragraphs,
} from '../components/heritage-reader/reader-utils'
import type { ArticleTranslation, HeritageMode, LearningState } from '../types'

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
  const [failedImageSiteId, setFailedImageSiteId] = useState<string | null>(
    null,
  )
  const [originalImageSiteId, setOriginalImageSiteId] = useState<string | null>(
    null,
  )
  const [readNotice, setReadNotice] = useState<number | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState(false)
  const viewedIdRef = useRef<string | undefined>(undefined)

  const heritageQuery = useQuery({
    queryKey: routeId
      ? queryKeys.heritage.detail(routeId)
      : queryKeys.heritage.random(mode, randomSequence),
    queryFn: () =>
      routeId ? getHeritage(routeId) : getRandomHeritage(mode, previousId),
    staleTime: routeId ? 60_000 : 0,
  })
  const site = heritageQuery.data
  const deepLTranslationQuery = useQuery({
    queryKey: queryKeys.translations.deepl(site?.uuid),
    queryFn: () => translateArticleWithDeepL(site!.uuid),
    enabled: false,
    retry: false,
  })
  const learningQuery = useQuery({
    queryKey: queryKeys.heritage.learning(site?.uuid),
    queryFn: () => getLearningState(site!.uuid),
    enabled: Boolean(site),
  })
  const highlightsQuery = useQuery({
    queryKey: queryKeys.highlights(site?.uuid),
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
        .then(() =>
          queryClient.invalidateQueries({ queryKey: queryKeys.stats }),
        )
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
        queryKeys.heritage.learning(data.heritageSiteId),
        (current) => ({ ...data, readCount: current?.readCount }),
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats })
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
      void queryClient.invalidateQueries({ queryKey: ['read-later'] })
    },
  })
  const readMutation = useMutation({
    mutationFn: () => recordHeritageRead(site!.uuid),
    onSuccess: (record) => {
      setReadNotice(record.id)
      queryClient.setQueryData<LearningState>(
        queryKeys.heritage.learning(site!.uuid),
        (current) =>
          current
            ? {
                ...current,
                isReadLater: false,
                readCount: (current.readCount ?? 0) + 1,
              }
            : current,
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats })
      void queryClient.invalidateQueries({ queryKey: queryKeys.history.all })
      void queryClient.invalidateQueries({ queryKey: ['read-later'] })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.heritage.learning(site!.uuid),
      })
    },
  })
  const undoMutation = useMutation({
    mutationFn: (readId: number) => undoHeritageRead(site!.uuid, readId),
    onSuccess: () => {
      setReadNotice(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats })
      void queryClient.invalidateQueries({ queryKey: queryKeys.history.all })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.heritage.learning(site!.uuid),
      })
    },
  })

  function changeMode(nextMode: HeritageMode) {
    window.localStorage.setItem('heritage-mode', nextMode)
    setModeState(nextMode)
    setSearchParams(nextMode === 'famous' ? { mode: 'famous' } : {})
    setPreviousId(site?.uuid)
    setRandomSequence((value) => value + 1)
    setFailedImageSiteId(null)
    setOriginalImageSiteId(null)
  }

  function showNext() {
    setTranslationDisplay(null)
    setCaptureMode(false)
    setHighlightMode(false)
    setFailedImageSiteId(null)
    setOriginalImageSiteId(null)
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

  async function downloadPdf() {
    if (!site) return
    setDownloadingPdf(true)
    setPdfError(false)
    try {
      await downloadHeritagePdf(site.uuid, site.nameEn)
    } catch {
      setPdfError(true)
    } finally {
      setDownloadingPdf(false)
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
  const optimizedImage = optimizedImageUrl(imageUrl, 640)
  const imageFailed = failedImageSiteId === site.uuid
  const imageUsingOriginal = originalImageSiteId === site.uuid
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
  const speechText = [
    site.nameEn,
    displayShortDescription,
    displayDescription,
    displayJustification,
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <AppShell>
      <section className="mx-auto w-[min(1240px,calc(100%-48px))] py-10 max-[760px]:w-[min(100%-32px,720px)]">
        {!routeId && <ModeSelector mode={mode} onChange={changeMode} />}

        <div className="grid grid-cols-[minmax(320px,0.82fr)_minmax(0,1fr)] items-center gap-[clamp(48px,7vw,100px)] max-[900px]:grid-cols-1">
          <figure className="m-0">
            <div className="aspect-[4/5] overflow-hidden bg-[#d9d0bd] shadow-[0_24px_55px_rgb(32_48_43_/_18%)]">
              {optimizedImage && !imageFailed ? (
                <img
                  className="size-full object-cover"
                  decoding="async"
                  fetchPriority="high"
                  src={
                    imageUsingOriginal
                      ? (imageUrl ?? optimizedImage)
                      : optimizedImage
                  }
                  alt={site.mainImageCaptionEn ?? site.nameEn}
                  onError={() => {
                    if (
                      imageUrl &&
                      optimizedImage !== imageUrl &&
                      !imageUsingOriginal
                    ) {
                      setOriginalImageSiteId(site.uuid)
                    } else {
                      setFailedImageSiteId(site.uuid)
                    }
                  }}
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
          onDownloadPdf={() => void downloadPdf()}
          downloadingPdf={downloadingPdf}
        />
        {pdfError && (
          <p className="mt-3 text-xs text-[#b85635]">
            PDFを作成できませんでした。時間をおいて再試行してください。
          </p>
        )}
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
