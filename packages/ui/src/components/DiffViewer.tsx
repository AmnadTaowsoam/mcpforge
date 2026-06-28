import React from 'react'

interface DiffLine {
  type: 'context' | 'add' | 'remove'
  content: string
  lineNo?: number
}

interface Props {
  filename?: string
  lines: DiffLine[]
  maxHeight?: string
  className?: string
}

const LINE_STYLES: Record<DiffLine['type'], string> = {
  context: 'bg-white text-neutral-800',
  add: 'bg-emerald-50 text-emerald-900',
  remove: 'bg-red-50 text-red-900 line-through opacity-70',
}

const GUTTER_STYLES: Record<DiffLine['type'], string> = {
  context: 'text-neutral-400',
  add: 'text-emerald-600 bg-emerald-100',
  remove: 'text-red-600 bg-red-100',
}

const PREFIX: Record<DiffLine['type'], string> = {
  context: ' ',
  add: '+',
  remove: '-',
}

export function DiffViewer({ filename, lines, maxHeight = '400px', className = '' }: Props) {
  return (
    <div className={`rounded border border-neutral-200 overflow-hidden font-mono text-xs ${className}`}>
      {filename && (
        <div className="px-3 py-2 bg-neutral-100 border-b border-neutral-200 text-xs text-neutral-600 font-medium">
          {filename}
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className={LINE_STYLES[line.type]}>
                <td
                  className={`w-8 px-2 py-0.5 text-center select-none border-r border-neutral-100 ${GUTTER_STYLES[line.type]}`}
                  aria-hidden="true"
                >
                  {PREFIX[line.type]}
                </td>
                {line.lineNo !== undefined && (
                  <td className="w-10 px-2 py-0.5 text-right text-neutral-400 select-none border-r border-neutral-100">
                    {line.lineNo}
                  </td>
                )}
                <td className="px-3 py-0.5 whitespace-pre">{line.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
