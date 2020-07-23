const error_helper = require('../helpers/error_helper');
const transforms = require('../helpers/transforms');
const references_sql = require('../mssql/references');
const _ = require('underscore')

exports.getReferences = async function(req, res) {
	let invalidData = false;
	let query = req.query;
	let typeId;
	let submissionId;
	let subcontractorId;
	let searchTerm;

	const data = {};

	if(!query) {
		invalidData = true;
	}
	else {
		referenceId = query.referenceId;
		typeId = query.typeId;
		subcontractorId = query.subcontractorId;
		submissionId = query.submissionId;
		pageSize = query.pageSize;
		pageNumber = query.pageNumber;
		orderBy = query.orderBy;
		orderDirection = query.orderDirection;

		if(orderBy && (     orderBy !== "type" &&
                        orderBy !== "companyName" &&
                        orderBy !== "contactName" &&
                        orderBy !== "contactEmail" &&
                        orderBy !== "contactPhone" &&
                        orderBy !== "refDate")) 
                        	invalidData = true;

		if(orderDirection && (orderDirection !== "ASC" && orderDirection !== "DESC")) invalidData = true;


		if(referenceId && (parseInt(referenceId) <= 0 || isNaN(parseInt(referenceId)))) invalidData = true;
		if(typeId && (parseInt(typeId) <= 0 || isNaN(parseInt(typeId)))) invalidData = true;
		if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
		if(submissionId && (parseInt(submissionId) <= 0 || isNaN(parseInt(submissionId)))) invalidData = true;
		if(pageSize && (parseInt(pageSize) <= 0 || isNaN(parseInt(pageSize)))) invalidData = true;
		if(pageNumber && (parseInt(pageNumber) <= 0 || isNaN(parseInt(pageNumber)))) invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
	}

	await references_sql.getReferences(query, function(err, result, totalCount, types, questions, submissions) {
		if(err) {
			return res.send(err);
		}
		data.totalCount = totalCount;
		data.references = result;
		data.questions = questions;
		data.submissions = submissions;
		data.referencesTypesPossibleValues = types;

		return res.status(200).json( { success: true, data: data });
	});
}

exports.createReference = async function(req, res) {
	if (_.isEmpty(req.body) || !req.body.typeId || !req.body.companyName || !req.body.savedFormId || !req.body.contactName
		|| !req.body.contactEmail || !req.body.contactPhone) {
    	var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    	return res.send(error);
  	}
	const params = {}
	let method = req.method;
	let originalUrl = req.originalUrl;
	
	params.reference = Object.assign({}, req.body);
	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;
  	
	references_sql.createReference(params, function(err, result, referenceId) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json( { success: true, data: { referenceId: referenceId } });
	});
}

exports.updateReference = async function(req, res) {
	const params = {};
	let invalidData = false;
	if (_.isEmpty(req.body) || !req.body.referenceId) {
		invalidData = true
  	}
  	if(parseInt(req.body.referenceId) <= 0 || isNaN(req.body.referenceId)) {
  		invalidData = true;
  	}
  	if (!req.body.typeId && !req.body.companyName && !req.body.submissionId && !req.body.contactName && !req.body.contactEmail && !req.body.contactPhone) {
  		invalidData = true;
  	}

  	if(invalidData) {
    	var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    	return res.send(error);
  	}

  	params.reference = Object.assign({}, req.body);
	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	references_sql.updateReference(params, function(err, result) {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, referenceUpdated: result });
	});
}

exports.createReferenceQuestion = async function(req, res) {
	if (_.isEmpty(req.body) || !req.body.referenceTypeId || !req.body.question) {
    	var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    	return res.send(error);
  	}

  	const params = {}
  	params.question = Object.assign({}, req.body);

  	references_sql.createReferenceQuestion(params, function(err, result, questionId) {
  		if(err){
  			error = error_helper.getSqlErrorData(err);
  			return res.send(error);
  		}
  		return res.status(200).json( { success: true, data: { questionId: questionId } });
  	});
}

exports.updateReferenceQuestion = async function(req, res) {
	if (_.isEmpty(req.body) || !req.body.questionId || !req.body.question) {
    	var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    	return res.send(error);
  	}

  	const params = {}
  	let method = req.method;
  	let originalUrl = req.originalUrl;

  	params.question = Object.assign({}, req.body);
  	params.userId = req.currentUser.Id;
  	params.eventDescription = method + '/' + originalUrl

  	references_sql.updateReferenceQuestion(params, function(err, result) {
  		if(err) {
  			error = error_helper.getSqlErrorData(err);
  			return res.send(error);
  		}
  		return res.status(200).json( { success: true });
  	});
}

exports.getReferenceResponses = async function(req, res) {
	const params = {}
	const data = {}
	if (!req.query.referenceId) {
    	var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    	return res.send(error);
  	}
	
	params.referenceId = req.query.referenceId;
	data.referenceId = params.referenceId;

	references_sql.getReferenceResponses(params, function(err, result) {
		if(err) {
			return res.send(err);
		}
		if(!result) {
			let error = error_helper.getErrorData(error_helper.CODE_REFERENCE_RESPONSE_NOT_FOUND, error_helper.MSG_REFERENCE_RESPONSE_NOT_FOUND);
			return res.send(error);
		}
		data.totalCount = result.length;
		data.responses = result;

		return res.status(200).json( { success: true, data: result });
	});
}

exports.createReferenceResponse = async function (req, res) {
	if (_.isEmpty(req.body) || !req.body.referenceId || !req.body.referenceQuestionId) {
    	var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    	return res.send(error);
  	}
	const params = {}
	let method = req.method;
	let originalUrl = req.originalUrl;
	
	params.response = Object.assign({}, req.body);
	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;
  	
	references_sql.createReferenceResponse(params, function(err, result, responseId) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json( { success: true, data: { responseId: responseId } });
	});
}