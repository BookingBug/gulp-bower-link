var through = require('through2');
    gutil = require('gulp-util');
    walk = require('walk');
    bower = require('bower');
    fs = require('fs');
    path = require('path');

module.exports = function (dir, name, localName, config) {
  var stream = through.obj(function(file, enc, callback) {
    this.push(file);
    callback();
  });

	opts = {};
	opts.cwd = opts.cwd || process.cwd();

  bower.commands.link(null, null, {cwd: dir})
		.on('log', function(result) {
			gutil.log(['bower', gutil.colors.cyan(result.id), result.message].join(' '));
		})
		.on('error', function(error) {
			stream.emit('error', new gutil.PluginError('gulp-bower', error));
			stream.end();
		})
		.on('end', function() {
      bower.commands.link(name, localName, config)
        .on('log', function(result) {
          gutil.log(['bower', gutil.colors.cyan(result.id), result.message].join(' '));
        })
        .on('error', function(error) {
          stream.emit('error', new gutil.PluginError('gulp-bower', error));
          stream.end();
        })
        .on('end', function() {
	        opts.cwd = opts.cwd || process.cwd();
          var baseDir = path.join(opts.cwd, dir);
          var walker = walk.walk(baseDir);
          walker.on("errors", function(root, stats, next) {
            stream.emit('error', new gutil.PluginError('gulp-bower', stats.error));
            next();
          });
          walker.on("directory", function(root, stats, next) {
            next();
          });
          walker.on("file", function(root, stats, next) {
            var filePath = path.resolve(root, stats.name);

            fs.readFile(filePath, function(error, data) {
              if (error)
                stream.emit('error', new gutil.PluginError('gulp-bower', error));
              else
                stream.write(new gutil.File({
                  path: path.relative(baseDir, filePath),
                  contents: data
                }));

              next();
            });
          });
          walker.on("end", function() {
            stream.end();
          });
        });
    });

  return stream;
}
