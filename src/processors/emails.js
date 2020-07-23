// FACADES
const emails_facade = require('../mssql/emails');

// HELPERS
const email_helper = require('../helpers/email_helper');
const error_helper = require('../helpers/error_helper');
const sql_helper = require('../mssql/mssql_helper');
const mail_query_provider = require('../providers/mails_query_provider');
const { verbose } = require('../../logConfig')

// PROVIDERS
const templates = require('../providers/templates_provider');

exports.sendEmail = async function (params, callback) {
	email = null
	var tempalteAlreadyLoaded = false;

	if(params.emailOptions)
		if(params.emailOptions.alreadyLoaded)
			tempalteAlreadyLoaded = true;

	if(!params.emailOptions)
		if(!params.emailOptions.alreadyLoaded)
			tempalteAlreadyLoaded = false;

	console.log("params.emailOptions.templateName:---------------");
	console.log(tempalteAlreadyLoaded);

	if(tempalteAlreadyLoaded == true) {
		let options = params.emailOptions;

		// Create email object
		email = templates.generateEmailTemplate(options);

		// Send Email
		email_helper.sendEmail(email, function(err, result) {
			if(err) {
				return callback(err, false);
			}
			options.messageTrackingId = result.id;

			// Callback to main thread
			callback(null, true);

			// Save email to db
			emails_facade.saveEmail(options, function(err, result) {
				if (err) {
				  // Log if there was an error saving email to db. In the future we may implement some retry logic.
				  console.log("there was an error saving the email to the DB")
				  console.log(err);
				}
				else {
				  console.log("Email saved to DB");
				}
				return;
			})
		});
	}
	else {
		// Get template
		await emails_facade.getEmailTemplate(params.templateName, function(err, result) {
			if(err) {
				return callback(err, false);
			}
			if(!result) {
				// If no template was found return emailSent false. (should not happen).
				return callback(null, false);
			}

			let options = Object.assign({}, params.emailOptions);
			options.from = result.FromAddress;
			options.subject = result.Subject;
			options.text = result.BodyText;
			options.html = result.BodyHTML;
			options.templateId = result.Id;

			// Create email object
			email = templates.generateEmailTemplate(options);

			// Send Email
			email_helper.sendEmail(email, function(err, result) {
				if(err) {
					return callback(err, false);
				}
				options.messageTrackingId = result.id;

				// Callback to main thread
				callback(null, true);

				// Save email to db
				emails_facade.saveEmail(options, function(err, result) {
					if (err) {
					  // Log if there was an error saving email to db. In the future we may implement some retry logic.
					  console.log("there was an error saving the email to the DB")
					  console.log(err);
					}
					else {
					  console.log("Email saved to DB");
					}
					return;
				})
			});
		});
	}
}

exports.sendEmailSimple = async function (options, callback) {
	try {
    const email = templates.generateEmailTemplate(options);

    // console.log('ACTUAL EMAIL TEMPLATE '.repeat(15))
    // console.log(email);

    if(verbose) {
	    console.log(options);
	    console.log(email);
   }

    // Send Email
    await email_helper.sendEmail(email, async function(err, result) {
        if(err) {
            console.log(err)
            return callback(err, false);
        }

        options.messageTrackingId = result.id;

        // Callback to main thread
        callback(null, true);

        // Save email to db
        await emails_facade.saveEmail(options, function(err, result) {
            if (err) {
                // Log if there was an error saving email to db. In the future we may implement some retry logic.
                console.log("there was an error saving the email to the DB")
                console.log(err);
            }
            else {
                // console.log('SENT AND SAVED '.repeat(15))
                console.log("Email sent and saved to DB");
            }

            return;
        });
    });
    }
    catch(err) {
    	console.log(err);
    }
}

exports.getAllTemplateFields = async function (hiringClientId,
																							 subcontractorId,
																							 userId,
																							 taskId,
																							 callback) {
	try {
		let data = {};

	  const connection = await sql_helper.getConnection();
		let queryHC = null;
		let resultHC = null;
		let querySC = null;
		let resultSC = null;
		let queryUser = null;
		let resultUser = null;
		let queryTask = null;
		let resultTask = null;

		if(hiringClientId) {
			queryHC = mail_query_provider.generateTemplateHCFieldsQuery(hiringClientId);
			resultHC = await connection.request().query(queryHC);
		}

		if(subcontractorId) {
			querySC = mail_query_provider.generateTemplateSCFieldsQuery(subcontractorId);
			resultSC = await connection.request().query(querySC);
		}

		if(userId) {
			queryUser = mail_query_provider.generateTemplateUserFieldsQuery(userId);
			resultUser = await connection.request().query(queryUser);
		}

		if(taskId) {
			queryTask = mail_query_provider.generateTemplateTaskFieldsQuery(taskId);
			resultTask = await connection.request().query(queryTask);
		}

		let queryCard = mail_query_provider.generateTemplateCardFieldsQuery();
		let resultCard = await connection.request().query(queryCard);

		let queryMisc = mail_query_provider.generateTemplateMiscFieldsQuery();
		let resultMisc = await connection.request().query(queryMisc);

		if(resultHC && resultHC.recordset.length > 0)
		{
			Object.assign(data, resultHC.recordset[0]);
		}

		if(resultSC && resultSC.recordset.length > 0)
		{
			Object.assign(data, resultSC.recordset[0]);
		}

		if(resultUser && resultUser.recordset.length > 0)
		{
			Object.assign(data, resultUser.recordset[0]);
		}

		if(resultTask && resultTask.recordset.length > 0)
		{
			Object.assign(data, resultTask.recordset[0]);
		}

		if(resultCard && resultCard.recordset.length > 0)
		{
			Object.assign(data, resultCard.recordset[0]);
		}

		if(resultMisc && resultMisc.recordset.length > 0)
		{
			Object.assign(data, resultMisc.recordset[0]);
		}

		callback(null, data);
	}
	catch (err) {
		console.log(err);
		callback(error_helper.getSqlErrorData(err), null);
	}
}
