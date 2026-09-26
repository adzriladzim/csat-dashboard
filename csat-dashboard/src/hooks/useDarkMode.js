import { useState, useEffect } from 'react'

export default function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('csat-theme')
    // Default to dark if no preference saved
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    root.classList.toggle('light', !dark)
    localStorage.setItem('csat-theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, setDark]
}
