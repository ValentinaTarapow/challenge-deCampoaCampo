import { classifyError, describeError } from './errors';

describe('classifyError', () => {
  it('detects offline / network errors', () => {
    expect(classifyError({ code: 'ERR_NETWORK' })).toBe('offline');
    expect(classifyError({ code: 'ENOTFOUND' })).toBe('offline');
    expect(classifyError({ message: 'Network Error' })).toBe('offline');
    expect(classifyError({ request: {} })).toBe('offline');
  });

  it('detects timeouts', () => {
    expect(classifyError({ code: 'ECONNABORTED' })).toBe('timeout');
    expect(classifyError({ message: 'timeout of 10000ms exceeded' })).toBe(
      'timeout',
    );
  });

  it('detects HTTP status kinds', () => {
    expect(classifyError({ response: { status: 404 } })).toBe('notFound');
    expect(classifyError({ response: { status: 500 } })).toBe('server');
    expect(classifyError({ response: { status: 400 } })).toBe('unknown');
  });

  it('falls back to unknown', () => {
    expect(classifyError(null)).toBe('unknown');
    expect(classifyError({})).toBe('unknown');
  });
});

describe('describeError', () => {
  it('returns a specific message for a missing Pokémon', () => {
    expect(
      describeError({ response: { status: 404 } }, 'detail', {
        query: 'missingno',
      }),
    ).toEqual({
      kind: 'notFound',
      title: 'Pokémon not found',
      message: 'There\'s no Pokémon called “missingno”.',
    });
  });

  it('returns a list-specific unknown error', () => {
    const result = describeError(new Error('boom'), 'list');
    expect(result.kind).toBe('unknown');
    expect(result.title).toBe('Something went wrong');
    expect(result.message).toBe('Could not load the Pokédex.');
  });

  it('returns an offline copy for the list context', () => {
    expect(describeError({ code: 'ERR_NETWORK' }, 'list')).toMatchObject({
      kind: 'offline',
      title: "You're offline",
      message: 'Check your connection and try again.',
    });
  });
});
