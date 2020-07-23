const templates = require('../mssql/templates')
const error_helper = require('../helpers/error_helper');
const transforms = require('../helpers/transforms');
const _ = require('underscore')


exports.getTemplates = async function(req, res) {
	const params = {}
	let invalidData = false
	let retVal = null;

	if(!req.query)
		invalidData = true;

	if(req.query.orderBy)
		if( !req.query.orderBy == 'id' ||
			!req.query.orderBy == 'templateName' ||
			!req.query.orderBy == 'subject' ||
			!req.query.orderBy == 'bodyHTML' ||
			!req.query.orderBy == 'bodyText' ||
			!req.query.orderBy == 'replacedTemplateId' ||
			!req.query.orderBy == 'templateActivityId' ||
			!req.query.orderBy == 'communicationTypeId'
		)
			invalidData = true;

	if(req.query.orderDirection)
		if( !req.query.orderDirection == 'ASC' ||
			!req.query.orderDirection == 'DESC')
			invalidData = true;


	if(req.query.pageSize && (parseInt(req.query.pageSize) <= 0 || isNaN(parseInt(req.query.pageSize)))) invalidData = true;
	if(req.query.pageNumber && (parseInt(req.query.pageNumber) <= 0 || isNaN(parseInt(req.query.pageNumber)))) invalidData = true;
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	params.templateId = req.query.templateId;
	params.communicationTypeId = req.query.communicationTypeId;
  params.hiringClientId = req.query.hiringClientId;
	params.searchTerm = req.query.searchTerm;
	params.pageSize = req.query.isBehalfHC ? 9999 : parseInt(req.query.pageSize);
	params.pageNumber = parseInt(req.query.pageNumber);
	params.orderBy = req.query.orderBy;
  params.orderDirection = req.query.orderDirection;
  
  console.log('params = ', params)

	templates.getTemplates(params, function(err, result, totalRowsCount) {
		if (err) {
			console.log(err);
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		if (!result) {
			let error = error_helper.getErrorData(error_helper.CODE_TEMPLATE_NOT_FOUND, error_helper.MSG_TEMPLATE_NOT_FOUND);
			return res.send(error);
		}

		result.templatesList = transforms.templatesRecordsetToResponse(result.templatesList, totalRowsCount);

		return res.status(200).json({ success: true, data: result });
	});
}

exports.postTemplate = async function(req, res) {
	let params = req.body;
	let requestValid = _isTemplateValid(params);
	if(!requestValid) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	let method = req.method;
	let originalUrl = req.originalUrl;

	//if a user adds a ' we should escape them
	params.bodyHTML = params.bodyHTML.replace("'", "''");
	params.bodyText = params.bodyText.replace("'", "''");
	params.subject = params.subject.replace("'", "''");

  	params.userId = req.currentUser.Id;
  	params.eventDescription = method + '/' + originalUrl;

	templates.createOrUpdateTemplate(params, function(err, result, templateId) {
		if(err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { templateId: templateId } });
	});
}

exports.getPlaceholders = async function(req, res) {

	templates.getPlaceholders(req.query.system, function(err, result) {
		if (err) {
			console.log(err);
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: result });
	});
}


_isTemplateValid = function(template) {
	let templateValid = true;
	if (!template.templateName) templateValid = false;
	if (!template.subject) templateValid = false;
	if (!template.bodyHTML) templateValid = false;
	if (!template.bodyText) templateValid = false;
	if (!template.templateActivityId) templateValid = false;
	if (!template.communicationTypeId) templateValid = false;
	//if (!template.fromAddress) templateValid = false;
	if (!template.ownerId) templateValid = false;

	return templateValid;
}
