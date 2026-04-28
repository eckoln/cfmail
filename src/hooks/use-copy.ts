import * as React from 'react'

export function useCopy(timeout = 2000) {
  const [isCopied, setIsCopied] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = React.useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setIsCopied(true)

        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }

        timerRef.current = setTimeout(() => {
          setIsCopied(false)
        }, timeout)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    },
    [timeout],
  )

  return { isCopied, copy }
}
