const emails_mssql = require('./emails_mssql')


exports.getMessageTemplate = async (templateNaame, holderId) => {
	try{
		const messageTemplate = await emails_mssql.getTemplateByName(holderId, templateNaame)
		
		return messageTemplate
	}
	catch(err){
		Error(err)
	}
}


exports.setEmailsOptions = (config, messageTemplate) => {
	emailOptions = {};
	emailOptions.from = config.fromEmailAddress;
	emailOptions.nameFrom = config.fromEmailName;
	emailOptions.subject = messageTemplate.subject;
	emailOptions.html = messageTemplate.bodyHTML;
	emailOptions.text = messageTemplate.bodyText;
	emailOptions.alreadyLoaded = false;
	
	emailOptions.createTask = true;
	emailOptions.taskDetail = config.taskDetail;
	emailOptions.currentUser = null;
	
	emailOptions.hiringClientId = hc_sc_pair.hiringClientId;
	emailOptions.subcontractorId = hc_sc_pair.subcontractorId;
	
	emailOptions.templateName = messageTemplate.templateName
	emailOptions.templateId = messageTemplate.id
	emailOptions.wfGenerated = 1; // Mark this email as generated by WF
	

	return emailOptions;
}