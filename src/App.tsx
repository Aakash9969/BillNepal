import { useEffect } from 'react'
import { Toaster } from '@/components/ui/Toaster'
import { AppShell, PrintPortal } from '@/components/layout/AppShell'
import { useApp } from '@/store'

function App() {
  /* keep the document language in sync with the UI language (screen readers) */
  const lang = useApp((s) => s.lang)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <>
      <AppShell />
      <PrintPortal />
      <Toaster />
    </>
  )
}

export default App
