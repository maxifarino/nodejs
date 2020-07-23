const projects = require('../mssql/projects');
const error_helper = require('../helpers/error_helper');
const _ = require('underscore')


// Search Project endpoint, by Project Name, Hiring Client, Project Status
exports.getProjects = async function(req, res) {

	const data = {};
	var invalidData = false;
	let queryParams = req.query;
	let projectName = queryParams.projectName;
	let hiringClientId = queryParams.hiringClientId;
	let subcontractorId = queryParams.subcontractorId;
	let projectStatusId = queryParams.projectStatusId;
	var tradeId = queryParams.tradeId;
	let orderBy = queryParams.orderBy;
	let orderDirection = queryParams.orderDirection;
	let pageNumber = queryParams.pageNumber;
	let pageSize = queryParams.pageSize;
	let searchTerm = queryParams.searchTerm;
	let getTotalCount= queryParams.pageSize;

	if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
	if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
	if(projectStatusId && (parseInt(projectStatusId) <= 0 || isNaN(parseInt(projectStatusId)))) invalidData = true;
	if(tradeId && (parseInt(tradeId) <= 0 || isNaN(parseInt(tradeId)))) invalidData = true;

	if(orderBy && ( orderBy !== "id" &&
                    orderBy !== "name" &&
                    orderBy !== "description" &&
                    orderBy !== "number" &&
                    orderBy !== "manager" &&
                    orderBy !== "address1" &&
                    orderBy !== "address2" &&
                    orderBy !== "city" &&
                    orderBy !== "state" &&
                    orderBy !== "zipCode" &&
                    orderBy !== "owner" &&
                    orderBy !== "statusId" &&
                    orderBy !== "status" &&
                    orderBy !== "hiringClientId" &&
                    orderBy !== "hiringClientName" &&
                    orderBy !== "contractsTotalAmount" &&
                    orderBy !== "contractsCount" &&
                    orderBy !== "timeStamp")) 
                        	invalidData = true;

	if(orderDirection && (orderDirection !== "ASC" && orderDirection !== "DESC")) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
	}

	queryParams.loggedUserId = req.currentUser.Id;

	await projects.getProjects(queryParams, function(err, projects, totalCount) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		return res.status(200).json({ success: true, totalCount:totalCount, data: projects });
	});
};

// Create a new project
exports.createProject = async function(req, res) {

	var params = req.body;
	var name = params.name;
	var description = params.description;
	var number = params.number;
	var manager = params.manager;
	var address1 = params.address1;
	var address2 = params.address2;
	var city = params.city;
	var state = params.state;
	var zipCode = params.zipCode;
	var owner = params.owner;
	var statusId = params.statusId;
	var hiringClientId = params.hiringClientId;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!name || !statusId || !hiringClientId) {
		invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await projects.createProject(params, function(err, result, projectId) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { projectId: projectId } });
	});
};

// Update and existing Project
exports.updateProject = async function(req, res) {
	var params = req.body;
	var id = params.id;
	var name = params.name;
	var description = params.description;
	var number = params.number;
	var manager = params.manager;
	var address1 = params.address1;
	var address2 = params.address2;
	var city = params.city;
	var state = params.state;
	var zipCode = params.zipCode;
	var owner = params.owner;
	var statusId = params.statusId;
	var hiringClientId = params.hiringClientId;
	var invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!name && !description && !number && !manager && !address1 && 
		!city && !state && !zipCode && !owner && !statusId && !hiringClientId) {
		invalidData = true;
	}

	if(!id) invalidData = true;
	if(id && (parseInt(id) <= 0 || isNaN(parseInt(id)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await projects.updateProject(params, function(err, result, projectId) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { projectId: id } });
	});
};

exports.getProjectsStatus = async function(req, res) {

	await projects.getProjectsStatus(function(err, projectsStatusList) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		return res.status(200).json({ success: true, projectsStatusList: projectsStatusList });
	});
};
