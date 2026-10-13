import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('ts_theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('ts_theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark(v => !v) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export function useColors() {
  const { isDark } = useTheme()
  return isDark
    ? {
        pageBg:         '#031A11',
        sectionBg:      '#041F14',
        cardBg:         '#0A2A1F',
        sidebarBg:      '#041F14',
        topbarBg:       '#041F14',
        border:         'rgba(255,255,255,0.07)',
        borderFocus:    '#16A34A',
        text:           '#F1F5F9',
        textMuted:      'rgba(255,255,255,0.45)',
        textSub:        'rgba(255,255,255,0.65)',
        inputBg:        '#0D2E20',
        inputBorder:    'rgba(255,255,255,0.1)',
        pillBg:         '#0A2A1F',
        pillBorder:     'rgba(255,255,255,0.1)',
        pillActiveBg:   '#fff',
        pillActiveColor:'#063B2D',
        pillColor:      'rgba(255,255,255,0.6)',
        hoverBg:        '#0D2E20',
        tableHover:     '#0D2E20',
        navItemColor:   'rgba(255,255,255,0.55)',
        navItemActive:  '#4ADE80',
        navItemActiveBg:'rgba(74,222,128,0.1)',
      }
    : {
        pageBg:         '#F8FAF9',
        sectionBg:      '#F8FAF9',
        cardBg:         '#ffffff',
        sidebarBg:      '#ffffff',
        topbarBg:       '#ffffff',
        border:         '#E8F5ED',
        borderFocus:    '#16A34A',
        text:           '#0F172A',
        textMuted:      '#64748B',
        textSub:        '#475569',
        inputBg:        '#ffffff',
        inputBorder:    '#E2E8F0',
        pillBg:         '#ffffff',
        pillBorder:     '#E2E8F0',
        pillActiveBg:   '#063B2D',
        pillActiveColor:'#ffffff',
        pillColor:      '#64748B',
        hoverBg:        '#F0FDF4',
        tableHover:     '#FAFBFC',
        navItemColor:   '#64748B',
        navItemActive:  '#16A34A',
        navItemActiveBg:'#F0FDF4',
      }
}
