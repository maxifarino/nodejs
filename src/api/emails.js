
const error_helper = require('../helpers/error_helper');
const email_helper = require('../helpers/email_helper');
const transforms = require('../helpers/transforms');
const emails = require('../mssql/emails');
const _ = require('underscore');

exports.trackEmail = async function(req, res) {

	if (_.isEmpty(req.body) || _.isEmpty(req.body.token) || _.isEmpty(req.body.timestamp) || _.isEmpty(req.body.signature)) {
	    return res.status(400).send();
	  }

	const security = {}

	security.timestamp = req.body.timestamp;
	security.token = req.body.token;
	security.signature = req.body.signature;

	const validWebhook = email_helper.verifyWebhook(security);

	if (!validWebhook) {
		// If webhook isn't valid we return 400.
		return res.status(400).send();
	}

	const messageEvent = transforms.webhookObjectToMessageEvent(req.body);

	emails.trackEmail(messageEvent, function(err, updated, id) {
		if(err) {
			// If there is an error we send Mailgun a 500 error code. Mailgun will attempt again.
			return res.status(500).send(err);
		}
		// Else we let Mailgun know that we were able to process the request.
		return res.status(200).send('OK');
	});
};

exports.sendEmail = async function(req, res) {
	let invalidData = false;
  let params = req.body;
  
  // console.log('MAIL '.repeat(40))
  // console.log('\n')
  // console.log('params = ', params)

	if(!params) {
		invalidData = true;
	}
	else {
		let emailsList = params.emailsList;
		let subject = params.subject;
		let body = params.body;
		let hiringClientId = params.hiringClientId;
		let subcontractorId = params.subcontractorId;
		let dueDate = params.dueDate;
		let taskDetail = params.taskDetail;

		if(!emailsList) invalidData = true;
		if(!subject) invalidData = true;
		if(!body) invalidData = true;
		if(!hiringClientId) invalidData = true;

		if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.status(500).send(error);
	}

	params.currentUser = req.currentUser;
	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await emails.sendEmail(params, function(err) {
  	if(err) {
  		console.log(err);
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true });
	});
}
