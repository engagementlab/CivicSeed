var blocks = {};

var self = module.exports = {

	registerConfigurationHelpers: function(hbs) {

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

	}

};