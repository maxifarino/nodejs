const contracts = require('../mssql/contracts');
const error_helper = require('../helpers/error_helper');
const _ = require('underscore')


// Search Contracts endpoint, by id, projectId, subcontractorId
exports.getContracts = async function(req, res) {

	const data = {};
	var queryParams = req.query;
	var invalidData = false;
	var id = null;
	var projectId = null;
	var projectName = null;
	var subcontractorId = null;	
	var subcontractorName = null;
	var orderBy = null
	var orderDirection = null

	if(queryParams.id != undefined) {
		id = queryParams.id;
	}

	if(queryParams.projectId != undefined) {
		projectId = queryParams.projectId;
	}

	if(queryParams.projectName != undefined) {
		projectName = queryParams.projectName;
	}

	if(queryParams.subcontractorId != undefined) {
		subcontractorId = queryParams.subcontractorId;
	}

	if(queryParams.subcontractorName != undefined) {
		subcontractorName = queryParams.subcontractorName;
	}

	if(queryParams.orderBy != undefined) {
		orderBy = queryParams.orderBy;
	}

	if(queryParams.orderDirection != undefined) {
		orderDirection = queryParams.orderDirection;
	}

	if(projectId && (parseInt(projectId) <= 0 || isNaN(parseInt(projectId)))) invalidData = true;
	if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
	if(orderBy && (     orderBy !== "projectId" &&
                        orderBy !== "projectName" &&
                        orderBy !== "subcontractorId" &&
                        orderBy !== "subcontractorName" &&
                        orderBy !== "number" &&
                        orderBy !== "startDate" &&
                        orderBy !== "endDate" &&
                        orderBy !== "tradeId" &&
                        orderBy !== "tradeValue" &&
                        orderBy !== "tradeDescription" &&
                        orderBy !== "timeStamp")) 
                        	invalidData = true;

	if(orderDirection && (orderDirection !== "ASC" && orderDirection !== "DESC")) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	await contracts.getContracts(id, projectId, projectName, subcontractorId, subcontractorName, 
							    orderBy, orderDirection, function(err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		return res.status(200).json({ success: true, data: result });
	});
};

// Create a new contract
exports.createContract = async function(req, res) {

	var params = req.body;
	var projectId = params.projectId;
	var subcontractorId = params.subcontractorId;
	var number = params.number;
	var startDate = params.startDate;
	var endDate = params.endDate;
	var amount = params.amount;
	var tradeId = params.tradeId;
	var scopeOfWork = params.scopeOfWork;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!projectId || !number || !startDate || !amount) {
		invalidData = true;
	}

	if(projectId && (parseInt(projectId) <= 0 || isNaN(parseInt(projectId)))) invalidData = true;
	if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await contracts.createContract(params, function(err, result, contractId) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { contractId: contractId } });
	});
};

// Update and existing contract
exports.updateContract = async function(req, res) {
	var params = req.body;
	var id = params.id;
	var projectId = params.projectId;
	var subcontractorId = params.subcontractorId;
	var number = params.number;
	var amount = params.amount;
	var startDate = params.startDate;
	var endDate = params.endDate;
	var amount = params.amount;
	var tradeId = params.tradeId;
	var scopeOfWork = params.scopeOfWork;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!projectId && !subcontractorId && !number && !startDate && !endDate && !amount && 
		!tradeId && !scopeOfWork && !amount) {
		invalidData = true;
	}

	if(!id) invalidData = true;
	if(id && (parseInt(id) <= 0 || isNaN(parseInt(id)))) invalidData = true;
	if(projectId && (parseInt(projectId) <= 0 || isNaN(parseInt(projectId)))) invalidData = true;
	if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await contracts.updateContract(params, function(err, result, projectId) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { contractId: id } });
	});
};

// Create a new contracts (receives a list)
exports.createContracts = async function(req, res) {

	var params = req.body;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}
	else {
		if(!params.contractsList) {
			invalidData = true;
		}
		else {
			for(i = 0; i < params.contractsList.length; i++) {
				let projectId = params.contractsList[i].projectId;
				let subcontractorId = params.contractsList[i].subcontractorId;
				let number = params.contractsList[i].number;
				let startDate = params.contractsList[i].startDate;
				let endDate = params.contractsList[i].endDate;
				let amount = params.contractsList[i].amount;
				let tradeId = params.contractsList[i].tradeId;
				let scopeOfWork = params.contractsList[i].scopeOfWork;				
				if(!projectId) invalidData = true;
				if(!number) invalidData = true;
				if(!startDate) invalidData = true;
				if(!amount) invalidData = true;
				if(projectId && (parseInt(projectId) <= 0 || isNaN(parseInt(projectId)))) invalidData = true;
				if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
			}
		}
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await contracts.createContracts(params, function(err, result, contractId) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true });
	});
};

// Update existing contracts
exports.updateContracts = async function(req, res) {
	var params = req.body;
	var invalidData = false;


	if(!params) {
		invalidData = true;
	}
	else {
		if(!params.contractsList) {
			invalidData = true;
		}
		else {
			for(i = 0; i < params.contractsList.length; i++) {
				let id = params.contractsList[i].id;
				let projectId = params.contractsList[i].projectId;
				let subcontractorId = params.contractsList[i].subcontractorId;
				let tradeId = params.contractsList[i].tradeId;
				if(id && (parseInt(id) <= 0 || isNaN(parseInt(id)))) invalidData = true;
				if(projectId && (parseInt(projectId) <= 0 || isNaN(parseInt(projectId)))) invalidData = true;
				if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
				if(tradeId && (parseInt(tradeId) <= 0 || isNaN(parseInt(tradeId)))) invalidData = true;
			}
		}
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await contracts.updateContracts(params, function(err, result, projectId) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true });
	});
};
