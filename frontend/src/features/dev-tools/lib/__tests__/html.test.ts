import { describe, expect, it } from 'vitest';

import { formatHtml } from '../html';

describe('formatHtml', () => {
  it('pretty-prints nested elements with indentation', () => {
    const result = formatHtml('<div><p>merhaba</p></div>', { mode: 'pretty', indent: '2' });
    expect(result.output).toBe('<div>\n  <p>\n    merhaba\n  </p>\n</div>');
  });

  it('treats void elements as self-closing and does not indent after them', () => {
    const result = formatHtml('<div><img src="a.png"><span>x</span></div>', {
      mode: 'pretty',
      indent: '2',
    });
    expect(result.output).toBe('<div>\n  <img src="a.png">\n  <span>\n    x\n  </span>\n</div>');
  });

  it('minifies by dropping whitespace between tags', () => {
    const result = formatHtml('<div>\n  <p>x</p>\n</div>', { mode: 'minify' });
    expect(result.output).toBe('<div><p>x</p></div>');
  });

  it('removes comments on minify when the toggle is on', () => {
    const result = formatHtml('<div><!-- not --><p>x</p></div>', {
      mode: 'minify',
      removeComments: true,
    });
    expect(result.output).toBe('<div><p>x</p></div>');
  });

  it('keeps raw element content untouched', () => {
    const result = formatHtml('<div><script>const a = 1 < 2;</script></div>', {
      mode: 'minify',
    });
    expect(result.output).toContain('<script>const a = 1 < 2;</script>');
  });

  it('reports element and size stats', () => {
    const result = formatHtml('<div><p>x</p></div>', { mode: 'pretty' });
    expect(result.stats.find((stat) => stat.label === 'Öğe')?.value).toBe('2');
  });

  it('throws on empty input', () => {
    expect(() => formatHtml('   ', { mode: 'pretty' })).toThrow(/Girdi boş/);
  });
});
