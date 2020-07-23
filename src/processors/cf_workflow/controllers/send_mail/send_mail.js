const utils = require('./email_utils')
const mail_processor = require('../../../../processors/emails')

exports.SendEmail = async (config, workflow) => {

	if (!config.fromEmailAddress || config.fromEmailAddress == "") {console.log("Bad component configuration!!!")}
	else {
		// Get template
		const messageTemplate = await utils.getMessageTemplate(config.templateName, workflow.HolderId)
        
        // Check it a template was found, if not log an error and do nothing
		if(messageTemplate == null) {
			console.log('No template was found for provided parameter: ' + config.templateName)
			return;
		}

		// Prepare email parameters
		let emailOptions = utils.setEmailsOptions(config, messageTemplate)
        
        //TODO: REVISAR DESDE ACA
		await mail_processor.getAllTemplateFields(emailOptions.hiringClientId, emailOptions.subcontractorId, null, null, function (err, data) {
			try {
				if (err) {
					error = error_helper.getSqlErrorData(err);
					console.log(err);
					callback(err);
				}

				console.log(data);

				Object.assign(emailOptions, data);
			}
			catch(err) {
				console.log("Message Template replacement error:");
				console.log(err);
				console.log(emailOptions);
			}
		});

		// Get contacts
		let contacts = await _scGetContacts(hc_sc_pair);

		if(verbose) console.log(contacts);

		// invite hash
		console.log("invite hash");
		let tokenParams = {};
		tokenParams.hiringClientId = hc_sc_pair.hiringClientId;
		tokenParams.subcontractorId = hc_sc_pair.subcontractorId;
		let hash = await hashProvider.createToken(tokenParams);
		console.log(emailOptions.url_registration);
		emailOptions.url_registration += '/register/' + hash;
		console.log(emailOptions.url_registration);


		// Send emails to all contacts
		for(let i = 0; i < contacts.length; i++) {
			mailTo = contacts[i].mail; // Where should we get this from? Last email? Current contact in DB?
			nameTo = contacts[i].fullName;

			//Set new options to email
			emailOptions.to = mailTo;
			emailOptions.name = nameTo;

			emailOptions.hiring_client_mail = mailTo;
			emailOptions.hiring_client_full_name = nameTo;

			emailOptions.subcontractor_mail = mailTo;
			emailOptions.subcontractor_full_name = nameTo;

			emailOptions.user_mail = mailTo;
			emailOptions.user_full_name = nameTo;

			if(verbose) console.log(emailOptions);

			await mail_processor.sendEmailSimple(emailOptions, function(err) {
				if (err) {
					let error = error_helper.getSqlErrorData(err);
					console.log(err);
					callback(err);
				}
			});
		}

		// Change status if required
		if(params.statusUpdateFlag == 'True') {
			if(verbose) console.log("Change status to: " + params.status);

			await workflows_mssql.setWfSCStatusByName(hc_sc_pair, params.status, function(err) {
				if (err) {
					let error = error_helper.getSqlErrorData(err);
					console.log(err);
					callback(err);
				}
			});
		}
	}
}