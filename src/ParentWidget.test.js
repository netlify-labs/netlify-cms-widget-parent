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

  it('should keep diacritis', () => {
    expect(sanitizePath('ăștia sunteți voi')).toBe('astia-sunteti-voi');
  });

  it('should keep diacritis and remove whitespace, trailing and leading characters', () => {
    expect(sanitizePath('?ăștia   sunteți voi ?  ')).toBe('astia-sunteti-voi');
  });

  it('should remove "."s', () => {
    expect(sanitizePath('who are.we')).toBe('who-are-we');
  });
});
