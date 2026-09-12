import { useEffect, useState } from 'react'

export function NetworkStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (online) return null
  return (
    <div
      className="bg-[#c98c47] px-4 py-2 text-center text-xs font-bold text-[#18352f]"
      role="status"
    >
      オフラインです。表示中の内容は最大24時間前のキャッシュの場合があります。更新・保存操作は再接続後にお試しください。
    </div>
  )
}
