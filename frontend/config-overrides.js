const path = require('path');

module.exports = function override(config) {
  config.resolve = config.resolve || {};
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser'),
    assert: require.resolve('assert'),
    util: require.resolve('util'),
    url: require.resolve('url'),
    os: require.resolve('os-browserify/browser'),
    path: require.resolve('path-browserify'),
    vm: require.resolve('vm-browserify'),
  };

  // Suppress noisy source map parse warnings from @confio/ics23 only
  // Example warning:
  // "Failed to parse source map from ... node_modules/@confio/ics23/src/*.ts"
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    (warning) => {
      const msg = typeof warning === 'string' ? warning : warning?.message || '';
      const resource = typeof warning === 'string' ? '' : warning?.module?.resource || '';
      const isSourceMap = /Failed to parse source map/i.test(msg);
      const isIcs23 = /[@\\/]confio[@\\/]ics23/.test(resource) || /[@\\/]confio[@\\/]ics23/.test(msg);
      return isSourceMap && isIcs23;
    }
  ];

  return config;
};
