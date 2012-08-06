var sys = require('sys');

function NotFound(msg) {
	this.name = 'NotFound';
	Error.call(this, msg);
	Error.captureStackTrace(this, arguments.callee);
}

sys.inherits(NotFound, Error);

module.exports.NotFound = NotFound;