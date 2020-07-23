const jwt = require('jsonwebtoken');

exports.createToken = async function(params) {
	return jwt.sign(params, 'miD0s*2X');
}

exports.parseToken = function(token) {
	return jwt.verify(token, 'miD0s*2X');
}