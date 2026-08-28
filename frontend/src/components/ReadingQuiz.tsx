import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getApiErrorMessage } from '../api/client'
import { getQuiz, submitQuiz } from '../api/quiz'

export function ReadingQuiz({
  heritageSiteId,
  heritageName,
}: {
  heritageSiteId: string
  heritageName: string
}) {
  const queryClient = useQueryClient()
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const quiz = useQuery({
    queryKey: ['quiz', heritageSiteId],
    queryFn: () => getQuiz(heritageSiteId),
    enabled: started,
  })
  const submit = useMutation({
    mutationFn: () => submitQuiz(heritageSiteId, answers),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['weekly-report'] })
    },
  })

  function restart() {
    setAnswers({})
    submit.reset()
  }

  if (!started) {
    return (
      <section className="border-y border-[#18352f]/15 py-12 text-center">
        <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
          READING CHECK
        </p>
        <h2 className="mt-3 font-serif text-3xl">英語で理解度を確かめる</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#18352f]/55">
          登録理由、国、カテゴリーなどから作る3〜5問の読後クイズです。回答後に根拠となる英文を確認できます。
        </p>
        <button
          className="mt-6 bg-[#18352f] px-6 py-3 text-xs font-bold text-white"
          onClick={() => setStarted(true)}
          type="button"
        >
          {heritageName} のクイズを始める
        </button>
      </section>
    )
  }

  if (quiz.isPending) {
    return (
      <section className="border-y border-[#18352f]/15 py-14 text-center text-sm">
        クイズを準備しています…
      </section>
    )
  }
  if (quiz.isError || !quiz.data) {
    return (
      <section className="border-y border-[#18352f]/15 py-12 text-center">
        <p className="text-sm text-[#b85635]">
          {getApiErrorMessage(quiz.error)}
        </p>
        <button
          className="mt-4 text-xs font-bold underline"
          onClick={() => quiz.refetch()}
          type="button"
        >
          再試行
        </button>
      </section>
    )
  }

  const allAnswered = quiz.data.questions.every(
    (question) => answers[question.id],
  )
  const resultMap = new Map(
    submit.data?.results.map((result) => [result.questionId, result]),
  )

  return (
    <section className="border-y border-[#18352f]/15 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[#b85635]">
            READING CHECK
          </p>
          <h2 className="mt-2 font-serif text-3xl">{quiz.data.title}</h2>
        </div>
        {submit.data && (
          <strong className="font-serif text-3xl text-[#b85635]">
            {submit.data.score} / {submit.data.total}
          </strong>
        )}
      </div>

      <ol className="mt-8 space-y-8">
        {quiz.data.questions.map((question, index) => {
          const result = resultMap.get(question.id)
          return (
            <li
              className="border border-[#18352f]/15 bg-white/40 p-6"
              key={question.id}
            >
              <p className="font-serif text-xl leading-8">
                <span className="mr-3 text-[#b85635]">{index + 1}.</span>
                {question.prompt}
              </p>
              <div className="mt-4 grid gap-2">
                {question.options.map((option) => (
                  <label
                    className={`flex cursor-pointer items-start gap-3 border px-4 py-3 text-sm leading-6 ${
                      answers[question.id] === option
                        ? 'border-[#18352f] bg-[#18352f]/6'
                        : 'border-[#18352f]/15'
                    }`}
                    key={option}
                  >
                    <input
                      checked={answers[question.id] === option}
                      disabled={Boolean(submit.data)}
                      name={question.id}
                      onChange={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: option,
                        }))
                      }
                      type="radio"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {result && (
                <div
                  className={`mt-4 border-l-4 p-4 text-sm leading-7 ${
                    result.correct
                      ? 'border-[#4f8871] bg-[#4f8871]/8'
                      : 'border-[#b85635] bg-[#b85635]/8'
                  }`}
                >
                  <strong>{result.correct ? 'Correct' : 'Not quite'}</strong>
                  {!result.correct && (
                    <p className="mt-1">
                      Correct answer: {result.correctAnswer}
                    </p>
                  )}
                  <p className="mt-2 text-[#18352f]/65">
                    Evidence: {result.evidence}
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div className="mt-7 flex flex-wrap gap-3">
        {!submit.data ? (
          <button
            className="bg-[#b85635] px-6 py-3 text-xs font-bold text-white disabled:opacity-40"
            disabled={!allAnswered || submit.isPending}
            onClick={() => submit.mutate()}
            type="button"
          >
            {submit.isPending ? '採点中…' : '回答を送信して根拠を見る'}
          </button>
        ) : (
          <button
            className="border border-[#18352f] px-6 py-3 text-xs font-bold"
            onClick={restart}
            type="button"
          >
            もう一度挑戦
          </button>
        )}
      </div>
      {submit.isError && (
        <p className="mt-3 text-xs text-[#b85635]">
          {getApiErrorMessage(submit.error)}
        </p>
      )}
    </section>
  )
}
