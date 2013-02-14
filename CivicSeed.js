var rootDir = process.cwd(),
	config = require(rootDir + '/config'),
	version = config.get('VERSION'),
	nodeEnv = config.get('ENVIRONMENT'),
	now = new Date();

var _CivicSeed = {
	VERSION: version,
	CACHE: nodeEnv === 'development' ? String(now.getFullYear()) +
		String(now.getMonth()) +
		String(now.getDate()) +
		String(now.getHours()) +
		String(now.getMinutes()) +
		String(now.getSeconds()) : version,
	ENVIRONMENT: nodeEnv,
	CLOUD_PATH: config.get('CLOUD_PATH')
};

var self = module.exports = {

	getGlobals: function() {
		return _CivicSeed;
	},

	get: function(key) {
		var value = _CivicSeed[key];
		return value ? value : false;
	},

	set: function(key, value) {
		if(typeof key === 'string' && value) {
			_CivicSeed[key] = value;
		}
	}

};