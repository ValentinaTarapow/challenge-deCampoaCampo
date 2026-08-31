import { onColor } from './colors';

describe('onColor', () => {
  it('picks dark text on a light background', () => {
    expect(onColor('#F2D94E')).toBe('#1A1A1A');
  });

  it('picks white text on a dark background', () => {
    expect(onColor('#0C69C8')).toBe('#FFFFFF');
  });

  it('expands shorthand hex', () => {
    expect(onColor('#fff')).toBe('#1A1A1A');
    expect(onColor('#000')).toBe('#FFFFFF');
  });
});
