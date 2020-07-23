const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper')
const queryProvider = require('../providers/query_provider');
const mail_query_provider = require('../providers/mails_query_provider');
const mail_processor = require('../processors/emails');
const tasks_facade = require('../mssql/tasks');
const { verbose } = require('../../logConfig')

exports.trackEmail = async function(params, callback) {
	const query = queryProvider.generateWebhookInsertQuery(params);

	sql_helper.createTransaction(query, callback);
}

exports.saveEmail = async function(email, callback) {
	// Remove '<' and '>' signs from messageId
	let messageTrackingId = email.messageTrackingId;
	messageTrackingId = messageTrackingId.replace('<', '');
	messageTrackingId = messageTrackingId.replace('>', '');
	email.messageTrackingId = messageTrackingId;

	const query = queryProvider.generateEmailInsertQuery(email);

	sql_helper.createTransaction(query, callback);

		if(verbose) {
			console.log("Mail save params:");
			console.log(email);
		}

	if(email.createTask == true) {
		// Add a task to the logged user
		let fromName = "";
		let fromEmail = "";
		if(email.currentUser == null) { //System is sending email
			fromName = email.nameFrom;
			fromEmail = email.from;
		}
		else { //Logged interactive user is sending email
			fromName = email.currentUser.FirstName + ' ' + email.currentUser.LastName;
			fromEmail = email.currentUser.Mail;
		}

		let toEmail = email.to;
		let toName = email.name;
		let subject = email.subject;
		let text = email.text;

		let body = {};
		var datetime = new Date();
		// body.name = datetime + ' - ' + subject;
		body.description = 'Sent to: ' + toName + ' - ' + toEmail + ' Sent From:' + fromName + ' - ' + fromEmail + ' Email message:' + text;

		/*
		if(email.taskDetail) {
			body.description = email.taskDetail;
		}
		*/

		body.typeId = 1; // Note

		let assignedToUserId = null;
		if(email.currentUser != null) {
			body.assignedToUserId = email.currentUser.Id;
		}
		else {
			body.assignedToRoleId = 2; // PQ Operator role
		}

		params = {};
		params.task = Object.assign({}, body);
		params.task.enteredByUserId = 3; // TODO : Luis user for system process Should this field be nullable?
		params.userId = assignedToUserId;
		params.eventDescription = 'POST//api/tasks';
		params.task.assetId = email.hiringClientId;
		params.task.assetTypeId = 1; // Hiring client asset type

		if(email.wfGenerated == 1) {
			params.task.assetId = email.subcontractorId;
			params.task.assetTypeId = 2; // Hiring client asset type
		}

		if(email.hiringClientId)
			params.task.hiringClientId = email.hiringClientId;
		
		params.task.subcontractorId = email.subcontractorId;
		params.task.dateDue = email.dueDate;
		params.task.tasksPriorityId = 2;
		params.task.wfGenerated = email.wfGenerated;
		params.task.name = email.templateName;
		if(email.hiringClientId)
			params.task.hiringClientId = email.hiringClientId;

		if(verbose) {
			console.log("Mail task params:");
			console.log(params);
		}

		await tasks_facade.createOrUpdateTask(params, function(err, result, taskId) {
			if (err) {
				error = error_helper.getSqlErrorData(err);
				callback(error);
			}
		});
	}
}

exports.getEmailTemplate = async function(templateName, callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = queryProvider.generateEmailTemplateQuery(templateName);
		const result = await connection.request().query(query);
		connection.close();

		if(result.recordset.length > 0)
		{
			template = result.recordset[0];
			callback(null, template);
		}
		else {
			console.log("No template found");
			callback(null, null);
		}
	}
	catch (err) {
		callback(error_helper.getSqlErrorData(err), null);
	}
}

exports.sendEmail = async function(params, callback) {
	try {
		//Send email
		// Get emails To from Ids
    let connection = await sql_helper.getConnection();
    
    if (params.isRequestorEmail) {
      const emailOptions = {
        subject: params.subject,
        html: params.body,
        hiringClientId: params.hiringClientId,
        subcontractorId: params.subcontractorId,
        subcontractorName: params.subcontractorName,
        requestorName: params.requestorName,
        name: params.requestorName,
        to: params.requestorEmail,
        from: params.emailToHCFromAddress,
        tieRating: params.tieRating,
	      singleProjectLimit: params.singleProjectLimit,
        aggregateProjectLimit: params.aggregateProjectLimit,
        templateId: params.templateId,
        alreadyLoaded: true
      };

      // console.log('LOADING EMAIL OPTIONS '.repeat(20))
      // console.log(emailOptions);

      await mail_processor.sendEmailSimple(emailOptions, function(err) {
        if (err) {
          const error = error_helper.getSqlErrorData(err);
          console.log(err);
          callback(err);
        }
      });

    } else {

      let queryMailsTo = mail_query_provider.generateEmailAccountsQuery(params.emailsList);
      let resultMailsTo = await connection.request().query(queryMailsTo);

      let mailsTo = resultMailsTo.recordset;
      let mailFrom = params.currentUser.Mail;

      let emailOptions = {
          alreadyLoaded: true,
          createTask: true,
          currentUser: params.currentUser,
          dueDate: params.dueDate,
          from: mailFrom,
          hiringClientId: params.hiringClientId,
          html: params.body,
          subcontractorId: params.subcontractorId,
          subject: params.subject,
          taskDetail: params.taskDetail,
          text: params.body
      };

      await mail_processor.getAllTemplateFields(params.hiringClientId, params.subcontractorId, null, null, function (err, data) {
          if (err) {
              error = error_helper.getSqlErrorData(err);
              console.log(err);
              callback(err);
          }

          Object.assign(emailOptions, data);
      });

      for(i = 0; i < mailsTo.length; i++) {
        let mailTo = mailsTo[i].mail;
        let nameTo = mailsTo[i].firstName + ' ' + mailsTo[i].lastName;

        //Set new options to email
        emailOptions.to = mailTo;
        emailOptions.name = nameTo;

        emailOptions.hiring_client_mail = mailTo;
        emailOptions.hiring_client_full_name = nameTo;

        emailOptions.subcontractor_mail = mailTo;
        emailOptions.subcontractor_full_name = nameTo;

        emailOptions.user_mail = mailTo;
        emailOptions.user_full_name = nameTo;

        await mail_processor.sendEmailSimple(emailOptions, function(err) {
          if (err) {
            error = error_helper.getSqlErrorData(err);
            console.log(err);
            callback(err);
          }
        });
      }

    }

		
	}
	catch(err) {
		callback(err);
	}
	callback(null);
}
