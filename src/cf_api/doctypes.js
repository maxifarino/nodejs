const docTypes = require('../cf_mssql/doctypes');
const error_helper = require('../helpers/error_helper');
const _ = require('underscore')


exports.getDocTypes = async function(req, res) {
	const data = {};
	var invalidData = false;
	let queryParams = req.query;
	let documentTypeName = queryParams.documentTypeName;
	let documentTypeId = queryParams.documentTypeId;
  let expireAmount = queryParams.expireAmount;
  let expirePeriod = queryParams.expirePeriod;
  let holderId = queryParams.holderId;
  let searchTerm = queryParams.searchTerm;

	let orderBy = queryParams.orderBy;
	let orderDirection = queryParams.orderDirection;
	let pageNumber = queryParams.pageNumber;
	let pageSize = queryParams.pageSize;
	let getTotalCount= queryParams.pageSize;

	if(orderBy && ( orderBy !== "documentTypeId" &&
                    orderBy !== "documentTypeName" &&
                    orderBy !== "expireAmount" &&
                    orderBy !== "expirePeriod" &&
                    orderBy !== "archived"
                     )) 
                        	invalidData = true;

  if(orderDirection && (orderDirection !== "ASC" && orderDirection !== "DESC")) invalidData = true;
	if(!holderId){
		invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
	}

	queryParams.loggedUserId = req.currentUser.Id;

	await docTypes.getDocTypes(queryParams, function(err, docTypes, totalCount) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true, totalCount:totalCount, data: docTypes });
	});
};


exports.createDocTypes = async function(req, res) {

	var params = req.body;
	let documentTypeName = params.documentTypeName;
  let expireAmount = params.expireAmount;
	let expirePeriod = params.expirePeriod;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

	/*if(!documentTypeName || !expireAmount || !expirePeriod) {
		invalidData = true;
	}*/
	if(!documentTypeName) {
		invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await docTypes.createDocTypes(params, function(err, result, documentTypeId) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { documentTypeId: documentTypeId } });
	});
};

exports.updateDocTypes = async function(req, res) {
  var params = req.body;
  console.log('PARAMS',params);
	let documentTypeName = params.documentTypeName;
	let documentTypeId = params.documentTypeId;
  let expireAmount = params.expireAmount;
	let expirePeriod = params.expirePeriod;
  let archived = params.archived;

	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!documentTypeName || !expireAmount || typeof params.archived == 'undefined') {
    invalidData = true;
  }
  
	if(!documentTypeId) invalidData = true;
	if(documentTypeId && (parseInt(documentTypeId) <= 0 || isNaN(parseInt(documentTypeId)))) invalidData = true;
	if(typeof params.archived !== 'undefined' && (parseInt(params.archived) != 0 && parseInt(params.archived) != 1 )) {
    invalidData = true;
  }

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await docTypes.updateDocTypes(params, function(err, result, documentTypeId) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { documentTypeId: documentTypeId } });
	});
};
