const tags = require('../cf_mssql/tags');
const error_helper = require('../helpers/error_helper');
const _ = require('underscore')


exports.getTags = async function(req, res) {
	const data = {};
	var invalidData = false;
	let queryParams = req.query;
	let tagName = queryParams.tagName;
	let tagId = queryParams.tagId;
  let CFHolderId = queryParams.CFHolderId;
	let CFdisplayOrder = queryParams.CFdisplayOrder;
	let CFdeletedFlag = queryParams.CFdeletedFlag;
  let searchTerm = queryParams.searchTerm;

	let orderBy = queryParams.orderBy;
	let orderDirection = queryParams.orderDirection;
	let pageNumber = queryParams.pageNumber;
	let pageSize = queryParams.pageSize;
	let getTotalCount= queryParams.pageSize;

	if(orderBy && ( orderBy !== "tagId" &&
                    orderBy !== "tagName" &&
                    orderBy !== "CFdisplayOrder" &&
                    orderBy !== "CFdeletedFlag" &&
                    orderBy !== "timeStamp")) 
                        	invalidData = true;

	if(orderDirection && (orderDirection !== "ASC" && orderDirection !== "DESC")) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
	}

	queryParams.loggedUserId = req.currentUser.Id;

	await tags.getTags(queryParams, function(err, tags, totalCount) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		return res.status(200).json({ success: true, totalCount:totalCount, data: tags });
	});
};


exports.createTags = async function(req, res) {

	var params = req.body;
	let tagName = params.tagName;
  let CFHolderId = params.CFHolderId;
	let CFdisplayOrder = params.CFdisplayOrder;
	let CFdeletedFlag = params.CFdeletedFlag;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!tagName || !CFHolderId || typeof params.CFdisplayOrder === 'undefined' || typeof params.CFdeletedFlag === 'undefined') {
		invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await tags.createTags(params, function(err, result, tagId) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { tagId: tagId } });
	});
};

exports.updateTags = async function(req, res) {
  var params = req.body;
  console.log('PARAMS',params);
	let tagName = params.tagName;
	let tagId = params.tagId;
  let CFHolderId = params.CFHolderId;
	let CFdisplayOrder = params.CFdisplayOrder;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!tagName || !CFHolderId || typeof params.CFdisplayOrder === 'undefined' || typeof params.CFdeletedFlag === 'undefined') {
    invalidData = true;
  }
  
	if(!tagId) invalidData = true;
	if(tagId && (parseInt(tagId) <= 0 || isNaN(parseInt(tagId)))) invalidData = true;
	if(typeof params.CFdeletedFlag !== 'undefined' && (parseInt(params.CFdeletedFlag) != 0 && parseInt(params.CFdeletedFlag) != 1 )) {
    invalidData = true;
  }

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await tags.updateTags(params, function(err, result, tagId) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { tagId: tagId } });
	});
};
