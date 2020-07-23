const error_helper = require('../helpers/error_helper');
const transforms = require('../helpers/transforms');
const tasks_facade = require('../mssql/tasks');
const _ = require('underscore')
const { writeLog } = require('../utils')

exports.createOrUpdateTask = async function(req, res) {
	let invalidData = false;
  let body = req.body;
  // writeLog(req.body)

	if(!body) {
		invalidData = true;
	}
	else {
		if(!body.name) invalidData = true;
		if(!body.description) invalidData = true;

		if(body.taskId && (parseInt(body.taskId) <= 0 || isNaN(parseInt(body.taskId)))) invalidData = true;
		if(body.typeId && (parseInt(body.typeId) <= 0 || isNaN(parseInt(body.typeId)))) invalidData = true;
		if(body.assignedToUserId && (parseInt(body.assignedToUserId) <= 0 || isNaN(parseInt(body.assignedToUserId)))) invalidData = true;
		if(body.assignedToRoleId && (parseInt(body.assignedToRoleId) <= 0 || isNaN(parseInt(body.assignedToRoleId)))) invalidData = true;
		if(body.tasksPriorityId && (parseInt(body.tasksPriorityId) <= 0 || isNaN(parseInt(body.tasksPriorityId)))) invalidData = true;
		if(body.hiringClientId && (parseInt(body.hiringClientId) <= 0 || isNaN(parseInt(body.hiringClientId)))) invalidData = true;
		if(body.subcontractorId && (parseInt(body.subcontractorId) <= 0 || isNaN(parseInt(body.subcontractorId)))) invalidData = true;
	}

	if(invalidData) {
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
  	return res.send(error);
	}

	const params = {}
  let dateDue = new Date(body.dateDue).toISOString();
  if(!body.dateDue || body.dateDue == null) {
  	dateDue = null;
  }
	let method = req.method;
	let originalUrl = req.originalUrl;
	
	params.task = Object.assign({}, body);
	params.task.enteredByUserId = req.currentUser.Id;
	params.task.dateDue = dateDue;
	params.task.completed = body.completed;
	params.task.contactTypeId = body.contactTypeId;	
	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;
	params.assetId = body.assetId;
	params.assetTypeId = body.assetTypeId;
	params.hiringClientId = body.hiringClientId;
	params.subcontractorId = body.subcontractorId;
  	
	await tasks_facade.createOrUpdateTask(params, function(err, result, taskId) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json( { success: true, data: { taskId: taskId } });
	});
}

exports.getTasks = async function(req, res) {
	var invalidData = false;
	const data = {};

  var params = req.query;

	if(!params) invalidData = true;

	if(params.taskId) {
		if(params.taskId && (parseInt(params.taskId) <= 0 || isNaN(parseInt(params.taskId)))) invalidData = true;
	}

	if(params.system) {
		if(params.system && (params.system != 'cf' && params.system != 'pq')) invalidData = true;
	}

	if(params.typeId) {
		if(params.typeId && (parseInt(params.typeId) <= 0 || isNaN(parseInt(params.typeId)))) invalidData = true;
	}

	if(params.statusId) {
		if(params.statusId && (parseInt(params.statusId) <= 0 || isNaN(parseInt(params.statusId)))) invalidData = true;
	}

	if(params.assignedToRoleId) {
		if(params.assignedToRoleId && (parseInt(params.assignedToRoleId) <= 0 || isNaN(parseInt(params.assignedToRoleId)))) invalidData = true;
	}

	if(params.tasksPriorityId) {
		if(params.tasksPriorityId && (parseInt(params.tasksPriorityId) <= 0 || isNaN(parseInt(params.tasksPriorityId)))) invalidData = true;
  }
  
	if(params.hiringClientId) {
		if(params.hiringClientId && (parseInt(params.hiringClientId) <= 0 || isNaN(parseInt(params.hiringClientId)))) invalidData = true;
  }
  
	if(params.subcontractorId) {
		if(params.subcontractorId && (parseInt(params.subcontractorId) <= 0 || isNaN(parseInt(params.subcontractorId)))) invalidData = true;
	}
	
	if(params.pageSize && (parseInt(params.pageSize) <= 0 || isNaN(parseInt(params.pageSize)))) invalidData = true;
	if(params.pageNumber && (parseInt(params.pageNumber) <= 0 || isNaN(parseInt(params.pageNumber)))) invalidData = true;
	if(params.assetTypeId && (parseInt(params.assetTypeId) <= 0 || isNaN(parseInt(params.assetTypeId)))) invalidData = true;
	

	if(params.orderDirection) {
		if(params.orderDirection != 'ASC' && params.orderDirection != 'DESC')
			invalidData = true;
	}		

	if(params.orderBy) {
		if(params.orderBy != 'id' &&
		   params.orderBy != 'name' &&
		   params.orderBy != 'description' &&
		   params.orderBy != 'typeId' &&
		   params.orderBy != 'statusId' &&
		   params.orderBy != 'assetId' &&
		   params.orderBy != 'assetTypeId' &&
		   params.orderBy != 'enteredDate' &&
		   params.orderBy != 'enteredByUserId' &&
		   params.orderBy != 'modifiedDate' &&
		   params.orderBy != 'modifyByUserId' &&
		   params.orderBy != 'assignedToUserId' &&
		   params.orderBy != 'assignedToRoleId' &&
		   params.orderBy != 'type' &&
		   params.orderBy != 'status' &&
		   params.orderBy != 'assetType' &&
		   params.orderBy != 'enteredByUser' &&
		   params.orderBy != 'modifyByUser' &&
		   params.orderBy != 'assignedToUser' &&
		   params.orderBy != 'assignedToRole' &&
		   params.orderBy != 'hiringClient' &&
		   params.orderBy != 'subcontractor' &&
		   params.orderBy != 'contactType' &&
		   params.orderBy != 'dueDate' &&
		   params.orderBy != 'dateDue') invalidData = true;
	}	

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	tasks_facade.getTasks(params, function(err, result, totalRowsCount) {
		if(err) {
			return res.send(err);
		}
		if(!result) {
			let error = error_helper.getErrorData(error_helper.CODE_TASK_NOT_FOUND, error_helper.MSG_TASK_NOT_FOUND);
			return res.send(error);
		}

		data.totalCount = totalRowsCount;
		data.tasks = result;

		return res.status(200).json( { success: true, data: data });
	});
}

exports.getNotifications = async function(req, res) {
	let invalidData = false;
	let userId = req.currentUser.Id;

	tasks_facade.getNotifications(userId, function(err, result) {
		if(err) {
			return res.send(err);
		}

		if(!result) {
			let error = error_helper.getErrorData(error_helper.CODE_TASK_NOT_FOUND, error_helper.MSG_TASK_NOT_FOUND);
			return res.send(error);
		}

		return res.status(200).json( { success: true, notificationsCount: result });
	});
}

exports.addNotification = async function(req, res) {
	try {
		let invalidData = false;
		let userId = req.currentUser.Id;

		await tasks_facade.addNotification(userId, function(err, result, taskId) {
			if (err) {
				error = error_helper.getSqlErrorData(err);
				return res.send(error);
			}
		});

		return res.status(200).json( { success: true });
	}
	catch(err) {
		console.log(err);
		return res.status(500).send(err);
	}
}

