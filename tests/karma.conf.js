module.exports = function(config) {
  config.set({
    basePath: '..',
    frameworks: ['jasmine'],
    browsers: ['PhantomJS', 'Firefox'],

    files: [
      'dist/knowledge-map.js',
      'tests/*.js'
    ],
  });
};
