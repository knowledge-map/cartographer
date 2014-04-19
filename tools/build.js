var browserify = require('browserify'),
    fs = require('fs');

var NAME = 'knowledge-map';
var SOURCE = './src/';
var BUILD  = './dist/';
var EXT = '.js';


// Create a bundle from the browserify pipline
function bundle(b, path) {
  var file = fs.createWriteStream(path);
  b
    .add(SOURCE+NAME+EXT)
    .bundle()
    .on('error', function (err) { console.error(err); })
    .pipe(file);
}

// Output to a file
bundle(browserify(), BUILD+NAME+EXT);

// Output version without D3
bundle(browserify().ignore('d3'), BUILD+NAME+'-noD3'+EXT);
