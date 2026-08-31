export function classifyError(error) {
  if (!error) return 'unknown';

  const code = error.code;
  const message = String(error.message || '');
  const status = error.response?.status;

  if (
    code === 'ERR_NETWORK' ||
    code === 'ENOTFOUND' ||
    message === 'Network Error'
  ) {
    return 'offline';
  }

  if (code === 'ECONNABORTED' || /timeout/i.test(message)) {
    return 'timeout';
  }

  if (status === 404) return 'notFound';
  if (status >= 500) return 'server';
  if (!error.response && error.request) return 'offline';

  return 'unknown';
}

const TITLES = {
  offline: "You're offline",
  timeout: 'Request timed out',
  notFound: {
    detail: 'Pokémon not found',
    default: 'Not found',
  },
  server: 'Server error',
  unknown: 'Something went wrong',
};

const MESSAGES = {
  offline: 'Check your connection and try again.',
  timeout: 'PokeAPI took too long to respond. Try again.',
  notFound: {
    detail: ({ query } = {}) =>
      query
        ? `There's no Pokémon called “${query}”.`
        : 'This Pokémon does not exist in the Pokédex.',
    list: 'The Pokédex list is not available right now.',
    filters: 'One of those filters is not available.',
    loadMore: 'Could not find more Pokémon.',
    extras: 'Some details for this Pokémon are missing.',
    default: 'The requested data was not found.',
  },
  server: 'PokeAPI is having trouble right now. Try again in a moment.',
  unknown: {
    list: 'Could not load the Pokédex.',
    detail: 'Could not load this Pokémon.',
    filters: 'Could not apply those filters.',
    loadMore: 'Could not load more Pokémon.',
    extras: 'Could not load extra details.',
    default: 'Something went wrong. Try again.',
  },
};

function pick(entry, context, extras) {
  if (typeof entry === 'string') return entry;
  const value = entry?.[context] ?? entry?.default ?? '';
  return typeof value === 'function' ? value(extras) : value;
}

export function describeError(error, context = 'default', extras = {}) {
  const kind = classifyError(error);
  return {
    kind,
    title: pick(TITLES[kind], context, extras),
    message: pick(MESSAGES[kind], context, extras),
  };
}

export const ERROR_ICONS = {
  offline: 'wifi-off',
  timeout: 'timer-sand',
  notFound: 'magnify-close',
  server: 'cloud-alert',
  unknown: 'alert-circle-outline',
};
