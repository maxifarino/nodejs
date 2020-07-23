_ = require('underscore');

exports.generateEmailTemplate = function (options) {
	const email = {}
	email.from = options.from;
	email.to = options.to;
	email.subject = options.subject;
	
	if(options.text) {
		text = _.template(options.text)
		email.text = text(options);
	}

	if(options.html) {
		html = _.template(options.html);
		email.html = html(options);		
  }
  // console.log('MAIL OPTIONS '.repeat(20))
  // console.log('options = ', options)
  // console.log('email = ', email)
	
	return email;
}