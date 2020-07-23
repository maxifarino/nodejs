const api_key = process.env.MAILGUN_API_KEY;
const DOMAIN = process.env.MAILGUN_DOMAIN;
const mailgun = require('mailgun-js')({apiKey: api_key, domain: DOMAIN});
const utils = require('./utils')


exports.sendEmail = async function(email, callback) {
  console.log("sending email");
  // console.log('SENDING MAIL NOW '.repeat(10));
	console.trace();
	mailgun.messages().send(email, callback); 
}

exports.verifyWebhook = function(params) {
	let timestamp = params.timestamp;
	let token = params.token;
	let signature = params.signature;
	let payload = timestamp.toString() + token;

	const hmac = utils.getHMAC(payload, api_key, 'sha256');

	return (signature === hmac);
}