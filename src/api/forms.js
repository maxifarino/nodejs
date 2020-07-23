const Forms = require('../mssql/forms')
const error_helper = require('../helpers/error_helper');
const transforms = require('../helpers/transforms');
const _ = require('underscore')
const file = require('./../api/files');


exports.getFormFieldsLists = async function (req, res) {

	Forms.getFormFieldsLists(function (err, result) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			res.status(500).send(error);
		}

		return res.status(200).json({ success: true, data: result });
	});

}

exports.getForm = async function (req, res) {
	const params = {};
	const trasnformsParams = {};

	let totalCount = 0;
	let retVal = null;
	let invalidData = false;
	let pageSize = null;
	let pageNumber = null;
	let orderBy = null;
	let orderDirection = null;
	let justFormData = null;
	let hiringClientId = null;
	let subcontractorId = null;
	let pagination = {}

	if (!req.query) {
		invalidData = true;
	}
	else {
		pageSize = req.query.pageSize;
		pageNumber = req.query.pageNumber;
		orderBy = req.query.orderBy;
		orderDirection = req.query.orderDirection;
		justFormData = req.query.justFormData;
		hiringClientId = req.query.hiringClientId;
		subcontractorId = req.query.subcontractorId;

		if (subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
		if (hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
		if (pageSize && (parseInt(pageSize) <= 0 || isNaN(parseInt(pageSize)))) invalidData = true;
		if (pageNumber && (parseInt(pageNumber) <= 0 || isNaN(parseInt(pageNumber)))) invalidData = true;
		if (orderBy && (
			orderBy !== "name" &&
			orderBy !== "dateCreated" &&
			orderBy !== "creatorFullName"
		)) invalidData = true;
		if (orderDirection && (orderDirection !== "ASC" && orderDirection !== "DESC")) invalidData = true;
		if (justFormData && (justFormData !== "true" && justFormData !== "false")) invalidData = true;

		pagination.pageSize = parseInt(pageSize);
		pagination.pageNumber = parseInt(pageNumber);

		trasnformsParams.pagination = pagination;
		trasnformsParams.orderBy = orderBy;

		if (req.query.formId) {
			params.formId = req.query.formId;
		}

		if (req.query.userId) {
			params.userId = req.query.userId;
		}

		if (req.query.formCreatorId) {
			params.formCreatorId = req.query.formCreatorId;
		}

		if (req.query.searchTerm) {
			params.searchTerm = req.query.searchTerm;
		}

		if (req.query.searchByCreator) {
			params.searchByCreator = req.query.searchByCreator;
		}

		if (req.query.searchBySentTo) {
			params.searchBySentTo = req.query.searchBySentTo;
		}

		if (orderBy) {
			params.orderBy = orderBy;
		}

		if (orderDirection) {
			params.orderDirection = orderDirection;
		}

		if (justFormData) {
			params.justFormData = justFormData;
		}

		if (hiringClientId) {
			params.hiringClientId = hiringClientId;
		}

		if (subcontractorId) {
			params.subcontractorId = subcontractorId;
		}
	}

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	Forms.getFormById(params, async function (err, result) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		if (!result) {
			let error = error_helper.getErrorData(error_helper.CODE_FORM_NOT_FOUND, error_helper.MSG_FORM_NOT_FOUND);
			return res.send(error);
		}

		retVal = await transforms.formsRecorsetToResponse(result.forms, trasnformsParams, justFormData);
		let data = { ...retVal, discreetAccounts: result.discreetAccounts, scorecardsFields: result.scorecardsFields };
		return res.status(200).json({ success: true, data: data });
	});
};

exports.getSavedFormFieldsValues = async function (req, res) {
	if (!req.query.savedFormId) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	const data = {};
	let savedFormId = req.query.savedFormId;
	let params = { "savedFormId": savedFormId };
	Forms.getSavedFormFieldsValues(params, function (err, result) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		if (!result) {
			let error = error_helper.getErrorData(error_helper.CODE_FORM_NOT_FOUND, error_helper.MSG_FORM_NOT_FOUND);
			return res.send(error);
		}
		data.totalCount = result.length;
		data.savedFormId = savedFormId;
		data.savedValues = transforms.formsSavedValuesRecorsetToResponse(result);
		return res.status(200).json({ success: true, data: data });
	});
};

exports.saveFormFieldsValues = async function (req, res) {
	if (_.isEmpty(req.body) || !req.body.savedFormId || !req.body.savedValues || req.body.savedValues.length <= 0) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	const params = req.body;
	let method = req.method;
	let originalUrl = req.originalUrl;
	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;

	await Forms.saveFormFieldsValues(params, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { valuesSaved: result } });
	});
}

exports.createForm = async function (req, res) {
	let invalidData = false;
	let body = req.body;

	if (!body) {
		invalidData = true;
	}
	else {
		let userId = body.userId;
		let hiringClientId = body.hiringClientId;
		let formCreatorId = body.formCreatorId;
		let formId = body.formId;
		let isComplete = body.isComplete;
		let SubcontractorFee = body.SubcontractorFee;

		if (userId && (parseInt(userId) <= 0 || isNaN(parseInt(userId)))) invalidData = true;
		if (hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
		if (formCreatorId && (parseInt(formCreatorId) <= 0 || isNaN(parseInt(formCreatorId)))) invalidData = true;
		if (formId && (parseInt(formId) <= 0 || isNaN(parseInt(formId)))) invalidData = true;
		if (isComplete && (parseInt(isComplete) <= 0 || isNaN(parseInt(isComplete)))) invalidData = true;
		if (!SubcontractorFee) invalidData = true;
	}

	if (invalidData == true) {
		var error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	const params = req.body;
	let method = req.method;
	let originalUrl = req.originalUrl;
	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;

	await Forms.createForm(params, function (err, result, formId) {
		var locFormId = formId;
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		if (params.id)
			locFormId = params.id;

		return res.status(200).json({ success: true, data: { formId: locFormId } });
	});
}

exports.createFormsSections = async function (req, res) {

	var invalidParams = false;
	var params = req.body;
	if (_.isEmpty(params))
		invalidParams = true;
	else if (!params.formId || !params.sectionPositionIndex)
		invalidParams = true;

	if (invalidParams) {
		var error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await Forms.createFormsSections(params, function (err, result, sectionId) {

		var locSectionId = sectionId;

		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		if (params.id)
			locSectionId = params.id;

		return res.status(200).json({ success: true, data: { sectionId: locSectionId } });
	});
}

exports.createFormsSectionsFields = async function (req, res) {
	var invalidParams = false;
	var params = req.body;
	if (_.isEmpty(params))
		invalidParams = true;
	else if (!params.formSectionId || !params.typeId || !params.columnPos || !params.rowPos)
		invalidParams = true;

	if (invalidParams) {
		var error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}
	await Forms.createFormsSectionsFields(params, function (err, result, fieldId) {
		var locFieldId = fieldId;
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		if (params.id)
			locFieldId = params.id;

		return res.status(200).json({ success: true, data: { fieldId: locFieldId } });
	});
}

exports.deleteForms = async function (req, res) {
	var invalidParams = false;
	var params = req.body;
	if (_.isEmpty(params))
		invalidParams = true;
	else if (!params.id)
		invalidParams = true;

	if (invalidParams) {
		var error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	let method = req.method;
	let originalUrl = req.originalUrl;
	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;

	await Forms.deleteForms(params, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { formId: params.id } });
	});
}
exports.deleteFormsSections = async function (req, res) {
	var invalidParams = false;
	var params = req.body;
	if (_.isEmpty(params))
		invalidParams = true;
	else if (!params.id)
		invalidParams = true;

	if (invalidParams) {
		var error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}
	await Forms.deleteFormsSections(params, function (err, result, fieldId) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { sectionId: params.id } });
	});
}

exports.deleteFormsSectionsFields = async function (req, res) {
	var invalidParams = false;
	var params = req.body;
	if (_.isEmpty(params))
		invalidParams = true;
	else if (!params.id)
		invalidParams = true;

	if (invalidParams) {
		var error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}
	await Forms.deleteFormsSectionsFields(params, function (err, result, fieldId) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { fieldId: params.id } });
	});
}

exports.createSavedForm = async function (req, res) {
	if (_.isEmpty(req.body) || !req.body.formId || !req.body.userId || !req.body.subContractorId || !req.body.hiringClientId) {
		var error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	const params = req.body;
	let method = req.method;
	let originalUrl = req.originalUrl;
	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;

	await Forms.createSavedForm(params, function (err, result, savedFormId) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { savedFormId: savedFormId } });
	});
}


exports.getSavedFormsFilters = async function (req, res) {

	Forms.getSavedFormsFilters(function (err, result) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: result });
	});
}

exports.getSavedForms = async function (req, res) {
	const data = {};
	let invalidData = false;
	let query = req.query;

	if (!query) {
		invalidData = true;
	}
	else {
		if (query.subcontractorId && (parseInt(query.subcontractorId) <= 0 || isNaN(parseInt(query.subcontractorId)))) invalidData = true;
		if (query.hiringClientId && (parseInt(query.hiringClientId) <= 0 || isNaN(parseInt(query.hiringClientId)))) invalidData = true;
		if (query.creatorUserId && (parseInt(query.creatorUserId) <= 0 || isNaN(parseInt(query.creatorUserId)))) invalidData = true;
		if (query.savedFormId && (parseInt(query.savedFormId) <= 0 || isNaN(parseInt(query.savedFormId)))) invalidData = true;
		if (query.formId && (parseInt(query.formId) <= 0 || isNaN(parseInt(query.formId)))) invalidData = true;
		if (query.pageNumber && (parseInt(query.pageNumber) <= 0 || isNaN(parseInt(query.pageNumber)))) invalidData = true;
		if (query.pageSize && (parseInt(query.pageSize) <= 0 || isNaN(parseInt(query.pageSize)))) invalidData = true;
		if (query.orderBy) {
			if (query.orderBy != 'formName' &&
				query.orderBy != 'submitterUserName' &&
				query.orderBy != 'subcontractorName' &&
				query.orderBy != 'hiringClientName' &&
				query.orderBy != 'status' &&
				query.orderBy != 'submissionDate') invalidData = true;
		}

		if (query.orderDirection)
			if (query.orderDirection != 'ASC' &&
				query.orderDirection != 'DESC') invalidData = true;
	}

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	Forms.getSavedForms(query, function (err, result, totalCount) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		if (!result) {
			let error = error_helper.getErrorData(error_helper.CODE_SAVED_FORM_NOT_FOUND, error_helper.MSG_SAVED_FORM_NOT_FOUND);
			return res.send(error);
		}

		data.totalCount = totalCount;
		data.savedForms = result;

		return res.status(200).json({ success: true, data: data });
	});
}

exports.getSavedFormsDateOfSubmission = async function (req, res) {
	const data = {};
	let invalidData = false;
	let query = req.query;

	if (!query) {
		invalidData = true;
	}
	else {
		let subcontractorId = query.subcontractorId;
		let hiringClientId = query.hiringClientId;

		if (!hiringClientId) invalidData = true;
		if (!subcontractorId) invalidData = true;

		if (hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
		if (subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
	}

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	Forms.getSavedFormsDateOfSubmission(query, function (err, result) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: result });
	});
}

exports.getSavedFormsDateOfPrequal = async function (req, res) {
	const data = {};
	let invalidData = false;
	let query = req.query;

	if (!query) {
		invalidData = true;
	}
	else {
		let subcontractorId = query.subcontractorId;
		let hiringClientId = query.hiringClientId;

		if (!hiringClientId) invalidData = true;
		if (!subcontractorId) invalidData = true;

		if (hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
		if (subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
	}

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	Forms.getSavedFormsDateOfPrequal(query, function (err, result) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: result });
	});
}

exports.updateSavedForm = async function (req, res) {
	if (_.isEmpty(req.body) || !req.body.savedFormId || !req.body.isComplete) {
		var error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	const params = req.body;
	let method = req.method;
	let originalUrl = req.originalUrl;

	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;
	await Forms.updateSavedForm(params, function (err, result, savedFormId) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { formUpdated: result } });
	});
}

exports.getFormsUsers = async function (req, res) {
	await Forms.getFormsUsers(function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { formCreatorUsers: result } });
	});
}

exports.getFormsSCSentTo = async function (req, res) {
	await Forms.getFormsSCSentTo(function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { formSCSentTo: result } });
	});
}

exports.getFormDiscreetAccounts = async function (req, res) {

	await Forms.getSavedFormByDiscreetAccounts(req.query.formId, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: result });
	});
}

exports.saveFormDiscreetAccount = async function (req, res) {
	await Forms.saveFormByDiscreetAccounts(req.body.data, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: result });
	});
}

exports.saveCopySubmission = async function (req, res) {
	await Forms.saveCopySubmission(req.body, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: result });
	});
}

exports.saveHiddenScorecardsFields = async function (req, res) {
	const { hiddenScorecardFields, formId } = req.body.data;

	if (!formId || !hiddenScorecardFields) {
		var error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await Forms.saveHiddenScorecardsFields(req.body.data, function (err) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true });
	});
}
