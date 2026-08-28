import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'

export function SpeechControls({ text }: { text: string }) {
  const speech = useSpeechSynthesis(text)

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="英文読み上げ"
    >
      <button
        className="rounded-full border border-[#18352f]/25 px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!speech.supported}
        onClick={speech.play}
        type="button"
        title={
          speech.supported
            ? undefined
            : 'このブラウザは読み上げに対応していません'
        }
      >
        {speech.status === 'paused' ? '▶ 再開' : '▶ 読み上げ'}
      </button>
      <button
        className="rounded-full border border-[#18352f]/25 px-3 py-2 text-xs font-bold disabled:opacity-40"
        disabled={speech.status !== 'playing'}
        onClick={speech.pause}
        type="button"
      >
        Ⅱ 一時停止
      </button>
      <button
        className="rounded-full border border-[#18352f]/25 px-3 py-2 text-xs font-bold disabled:opacity-40"
        disabled={speech.status === 'idle'}
        onClick={speech.stop}
        type="button"
      >
        ■ 停止
      </button>
      <label className="ml-1 flex items-center gap-2 text-xs text-[#18352f]/65">
        速度
        <select
          className="rounded border border-[#18352f]/25 bg-transparent px-2 py-1.5"
          value={speech.rate}
          onChange={(event) => speech.setRate(Number(event.target.value))}
        >
          <option value="0.75">0.75</option>
          <option value="1">1.0</option>
          <option value="1.25">1.25</option>
        </select>
      </label>
    </div>
  )
}
