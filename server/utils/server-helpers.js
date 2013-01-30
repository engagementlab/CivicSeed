var rootDir = process.cwd(),
	ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i,
	exec = require('child_process').exec,
	cached,
	command,
	filterRE;

if(process.platform === 'win32') {
	command = 'ipconfig';
	filterRE = /\bIPv[46][^:\r\n]+:\s*([^\s]+)/g;
} else if(process.platform === 'darwin') {
	command = 'ifconfig';
	filterRE = /\binet\s+([^\s]+)/g;
} else {
	command = 'ifconfig';
	filterRE = /\binet\b[^:]+:\s*([^\s]+)/g;
}

var self = module.exports = {

	getNetworkIPs: function(callback, bypassCache) {
		if(cached && !bypassCache) {
			callback(null, cached);
			return;
		}
		exec(command, function(error, stdout, sterr) {
			cached = [];
			var ip;
			var matches = stdout.match(filterRE) || [];
			for(var i = 0; i < matches.length; i++) {
				ip = matches[i].replace(filterRE, '$1');
				if(!ignoreRE.test(ip)) {
					cached.push(ip);
				}
			}
			callback(error, cached);
		});
	}

};