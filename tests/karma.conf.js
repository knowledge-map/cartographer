module.exports = function(config) {
  config.set({
    basePath: '..',
    files: [
      '*.js',
      'tests/*.js'
    ],
    frameworks: ['jasmine'],
  });
};