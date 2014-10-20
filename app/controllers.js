var rootDir = process.cwd();

var self = module.exports = {

	loadAll: function(app, service, callback) {

		console.log('\n\n   * * * * * * * * * * * *   Loading Controllers   * * * * * * * * * * * *   '.yellow);
		require(rootDir + '/server/controllers/app-control').init(app, service);

		console.log('   * * * * * * * * * * * *   All controllers loaded...\n\n'.green);
		if(typeof callback === 'function') { callback(); }

	}

};