import { describe, it, expect } from 'vitest'
import { render } from '../template-engine.js'

describe('render()', () => {
  it('substitutes a single variable', () => {
    expect(render('Hello {{name}}!', { name: 'World' })).toBe('Hello World!')
  })

  it('substitutes multiple occurrences of the same variable', () => {
    expect(render('{{x}} + {{x}} = 2{{x}}', { x: '1' })).toBe('1 + 1 = 21')
  })

  it('leaves unknown placeholders intact', () => {
    expect(render('{{known}} {{unknown}}', { known: 'ok' })).toBe('ok {{unknown}}')
  })

  it('handles empty vars map', () => {
    expect(render('no vars here', {})).toBe('no vars here')
  })

  it('handles template with no placeholders', () => {
    expect(render('static text', { x: 'y' })).toBe('static text')
  })

  it('replaces all named vars in a multi-line template', () => {
    const tmpl = 'name={{connectorName}}\ntype={{connectorType}}'
    const result = render(tmpl, { connectorName: 'Stripe', connectorType: 'REST' })
    expect(result).toBe('name=Stripe\ntype=REST')
  })
})
