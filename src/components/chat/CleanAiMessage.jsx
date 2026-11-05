import React from 'react'

export default function CleanAiMessage({ content }) {
  if (!content) return null

  const lines = content.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeBuffer = []

  lines.forEach((line, index) => {
    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div
            key={`code-${index}`}
            className="my-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-400 shadow-inner"
          >
            <pre>{codeBuffer.join('\n')}</pre>
          </div>
        )
        codeBuffer = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      return
    }

    const trimmed = line.trim()
    if (!trimmed) {
      elements.push(<div key={`blank-${index}`} className="h-1.5" />)
      return
    }

    // Section title / header: # or ## or ###
    const isHeader = /^#{1,6}\s+/.test(trimmed)
    if (isHeader) {
      const headerText = trimmed.replace(/^#{1,6}\s+/, '').replace(/[\*#]/g, '')
      elements.push(
        <div
          key={`head-${index}`}
          className="font-extrabold text-cyan-300 text-sm md:text-base mt-3 mb-1 tracking-tight flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>{headerText}</span>
        </div>
      )
      return
    }

    // Bullet point: * or - or •
    const isBullet = /^\s*[\*\-•]\s+/.test(trimmed)
    const lineWithoutBullet = trimmed.replace(/^\s*[\*\-•]\s+/, '')

    // Parse inline bolding: **text**
    const renderInline = (str) => {
      const parts = str.split('**')
      return parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return (
            <strong key={pIdx} className="font-bold text-white">
              {part.replace(/[\*#]/g, '')}
            </strong>
          )
        }
        const clean = part.replace(/[\*#]/g, '')
        return <span key={pIdx}>{clean}</span>
      })
    }

    if (isBullet) {
      elements.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 my-1 pl-1 text-slate-200">
          <span className="text-cyan-400 font-bold select-none text-xs leading-5">•</span>
          <div className="flex-1 leading-relaxed text-xs md:text-sm">
            {renderInline(lineWithoutBullet)}
          </div>
        </div>
      )
    } else {
      elements.push(
        <div key={`p-${index}`} className="leading-relaxed text-xs md:text-sm text-slate-200 my-0.5">
          {renderInline(trimmed)}
        </div>
      )
    }
  })

  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <div
        key="code-final"
        className="my-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-400"
      >
        <pre>{codeBuffer.join('\n')}</pre>
      </div>
    )
  }

  return <div className="space-y-0.5">{elements}</div>
}

