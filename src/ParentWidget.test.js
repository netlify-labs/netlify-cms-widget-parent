import { sanitizePath } from './ParentWidget';

describe('sanitizePath', () => {
  it('should lowercase string', () => {
    expect(sanitizePath('Who')).toBe('who');
  });

  it('should replace spaces with dashes', () => {
    expect(sanitizePath('Who Are We')).toBe('who-are-we');
  });

  it('should remove trailing replacer', () => {
    expect(sanitizePath('Who Are We?')).toBe('who-are-we');
  });

  it('should remove leading replacer', () => {
    expect(sanitizePath('?Who Are We')).toBe('who-are-we');
  });

  it('should remove double replacer', () => {
    expect(sanitizePath('Who   Are    We')).toBe('who-are-we');
  });
});
