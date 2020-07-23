const projects = require('../cf_mssql/projects');
const error_helper = require('../helpers/error_helper');
const _ = require('underscore')

exports.addFavorite = async function (req, res) {
	const data = {};
	var params = {}
	var invalidData = false;
	let userId = req.body.userId;
	var projectId = req.body.projectId;

	if (!userId || (parseInt(userId) <= 0 || isNaN(parseInt(userId)))) invalidData = true;
	if (!projectId || (parseInt(projectId) <= 0 || isNaN(parseInt(projectId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}
	params.userId = userId;
	params.projectId = projectId;

	await projects.getFavorite(params, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		console.log('result', result);
		if (result.length == 0) {

			projects.addFavorite(params, function (err, result) {
				if (err) {
					error = error_helper.getSqlErrorData(err);
				}
				console.log('result', result);
				return res.status(200).json({ success: true, data: { favorite_on: result } });
			});

		} else {
			return res.status(200).json({ success: true, data: { favorite_on: false, message: 'Project already exist' } });
		}
	})
};

exports.removeFavorite = async function (req, res) {
	const data = {};
	var params = {}
	var invalidData = false;
	let userId = req.body.userId;
	var projectId = req.body.projectId;

	if (!userId || (parseInt(userId) <= 0 || isNaN(parseInt(userId)))) invalidData = true;
	if (!projectId || (parseInt(projectId) <= 0 || isNaN(parseInt(projectId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}
	params.userId = userId;
	params.projectId = projectId;

	await projects.removeFavorite(params, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		console.log('result', result);
		return res.status(200).json({ success: true, data: { favorite_off: result } });
	});
};


exports.getProjects = async function (req, res) {
	const data = {};
	var invalidData = false;
	let queryParams = req.query;
	let projectName = queryParams.projectName;
	let holderId = queryParams.holderId;
	let holderName = queryParams.holderName;
	let insuredId = queryParams.insuredId;
	let searchTerm = queryParams.searchTerm;
	let statusId = queryParams.statusId;
	let projectStatusId = queryParams.projectStatusId;
	let state = queryParams.state;
	let myList = queryParams.mylist;

	let orderBy = queryParams.orderBy;
	let orderDirection = queryParams.orderDirection;
	let pageNumber = queryParams.pageNumber;
	let pageSize = queryParams.pageSize;
	let getTotalCount = queryParams.pageSize;
	if (holderId && (parseInt(holderId) <= 0 || isNaN(parseInt(holderId)))) invalidData = true;
	if (insuredId && (parseInt(insuredId) <= 0 || isNaN(parseInt(insuredId)))) invalidData = true;

	if (orderBy && (orderBy !== "id" &&
		orderBy !== "name" &&
		orderBy !== "description" &&
		orderBy !== "city" &&
		orderBy !== "state" &&
		orderBy !== "owner" &&
		orderBy !== "statusId" &&
		orderBy !== "status" &&
		orderBy !== "holderId" &&
		orderBy !== "holderName" &&
		orderBy !== "mylist" &&
		orderBy !== "number" &&
		orderBy !== "timeStamp"))
		invalidData = true;

	if (orderDirection && (orderDirection !== "ASC" && orderDirection !== "DESC")) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}
	console.log('queryParams', queryParams);
	queryParams.loggedUserId = req.currentUser.Id;
	console.log('queryParams', queryParams);
	await projects.getProjects(queryParams, function (err, projects, totalCount, amountProjectsNonArchive) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		return res.status(200).json({ success: true, totalCount: totalCount, data: projects, amountProjectsNonArchive: amountProjectsNonArchive });
	});
};



exports.getProjectDetail = async function (req, res) {
	const data = {};
	var invalidData = false;
	let queryParams = req.query;
	let projectId = queryParams.projectId;


	if (!projectId) invalidData = true;
	if (projectId && (parseInt(projectId) <= 0 || isNaN(parseInt(projectId)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}
	console.log('queryParams', queryParams);
	queryParams.loggedUserId = req.currentUser.Id;

	console.log('queryParams', queryParams);
	await projects.getProjectDetail(queryParams, function (err, project) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		console.log('result', project);
		if (project.length == 0) {
			error = error_helper.getErrorData(error_helper.CODE_PROJECT_NOT_FOUND, error_helper.MSG_PROJECT_NOT_FOUND);
			console.log(error);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: project[0] });
	});
};


// Create a new project
exports.createProject = async function (req, res) {
	var params = req.body;
	console.log('PARAMS', params);
	var name = params.name;
	var description = params.description;
	var number = params.number;
	var manager = params.manager;
	var address1 = params.address1;
	var address2 = params.address2;
	var city = params.city;
	var state = params.state;
	var zipCode = params.zipCode;
	var note = params.note;

	var owner = params.owner;
	var statusId = params.statusId;
	var holderId = params.holderId;

	var CFTrackingNumber = params.CFTrackingNumber;
	var CFCountryId = params.CFCountryId;
	var CFContactName = params.CFContactName;
	var CFContactPhone = params.CFContactPhone;

	var invalidData = false;

	if (!params) {
		invalidData = true;
	}

	if (!name || !holderId) {
		invalidData = true;
	}

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;
	params.statusId = 2; // ProjectStatus 2 => inProgress

	await projects.createProject(params, function (err, result, projectId) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: { projectId: projectId } });
	});
};

// Update and existing Project
exports.updateProject = async function (req, res) {
	var params = req.body;
	console.log('PARAMS', params);
	var id = params.id;
	var name = params.name;
	var description = params.description;
	var address1 = params.address1;
	var address2 = params.address2;
	var city = params.city;
	var state = params.state;
	var zipCode = params.zipCode;
	var note = params.note;

	var owner = params.owner;
	var statusId = params.statusId;
	var holderId = params.holderId;

	var CFTrackingNumber = params.CFTrackingNumber;
	var CFCountryId = params.CFCountryId;
	var CFContactName = params.CFContactName;
	var CFContactPhone = params.CFContactPhone;

	var invalidData = false;

	if (!params) {
		invalidData = true;
	}

	if (!name || !holderId) {
		invalidData = true;
		console.log('error1');
	}

	if (!id) invalidData = true;
	if (id && (parseInt(id) <= 0 || isNaN(parseInt(id)))) {
		invalidData = true;
		console.log('error2');
	}

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	await projects.updateProject(params, function (err, result, projectId) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: { projectId: id } });
	});
};

exports.getProjectsStatus = async function (req, res) {

	await projects.getProjectsStatus(function (err, projectsStatusList) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		return res.status(200).json({ success: true, projectsStatusList: projectsStatusList });
	});
};

exports.archiveProject = async function (req, res) {
	const params = req.body;
	let invalidData = false;

	if (!params) {
		invalidData = true;
	}
	if (!params.id || (parseInt(params.id) <= 0 || isNaN(parseInt(params.id)))) invalidData = true;

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	const payload = {
		id: params.id,
		archived: params.archived
	};

	await projects.updateProject(payload, function (err, result, projectId) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { projectId: params.id } });
	});
};