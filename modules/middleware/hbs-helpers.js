var fs = require('fs');
var hbs = require('hbs');
var blocks = {};
var isHbs = /\.hbs$/g;
var hidden = /^\_/g;
var rootDir = process.cwd();

var self = module.exports = {

	init: function() {

		self.registerHelpers();

		// load all partials from all folders and files in views/partials/, recursively
		self.registerPartials(rootDir + '/client/views/partials', '');

	},

	registerHelpers: function() {

		// console.log(hbs.compile);

		// hbs.compile

		hbs.registerHelper('extend', function(name, context) {
			var block = blocks[name];
			if(!block) {
				block = blocks[name] = [];
			}
			block.push(context(this));
		});

		hbs.registerHelper('block', function(name) {
			var val = (blocks[name] || []).join('\n');
			blocks[name] = [];
			return val;
		});

		hbs.registerHelper('admin', function(name, context) {

			return true;

		});

	},

	registerPartials: function(rootDir, partialName) {

		fs.readdir(rootDir, function(err, files) {
			if(err) {
				throw err;
			}
			files.forEach(function(file) {
				var fullPath = rootDir + '/' + file;
				var fullPartialName = file.replace('.hbs', '');
				if(partialName !== '') {
					fullPartialName = partialName + '-' + fullPartialName;
				}
				try {
					var stats = fs.lstatSync(fullPath);
					if(stats.isDirectory()) {
						self.registerPartials(fullPath, fullPartialName);
					}
				}
				catch (e) {
					console.log(' *** ERROR CHECKING FOR VIEWS/PARTIALS DIRECTORY *** '.red.inverse)
				}
				if(file.match(isHbs)) {
					if(!file.match(hidden)) {
						fs.readFile(fullPath, 'utf8', function(err, str) {
							if(err) {
								console.error('Could not open file: %s', err);
								process.exit(1);
							}
							// alternate method???
							// see https://github.com/donpark/hbs/blob/master/lib/hbs.js
							// @ line 49
							// var template = hbs.compile(str);

							hbs.registerPartial(fullPartialName, str);
							console.log('CS: '.blue + 'Loading handlebars file '.magenta + file.yellow.underline + ' as partial '.magenta + fullPartialName.yellow.underline);

						});
					}
				}
			});
		});

	}

};