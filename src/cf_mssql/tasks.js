const moment = require('moment');

const sql_helper = require('../mssql/mssql_helper');
const error_helper = require('../helpers/error_helper')
const tasks_query_provider = require('../cf_providers/tasks_query_provider');
const logger = require('../mssql/log');
const documentsHelper = require('./documents');
const holderHelper = require('./holders');



exports.getTasks = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		var query;
		var result;
		var totalRowsCount = 0;


		//Get Status list
		var queryContactsTypes = tasks_query_provider.generateTasksContactsTypesQuery();
		var resultContactsTypes = await connection.request().query(queryContactsTypes);

		var queryStatus = tasks_query_provider.generateTasksStatusQuery();
		var resultStatus = await connection.request().query(queryStatus);

		//Get Types list
		var queryTypes = tasks_query_provider.generateTasksTypesQuery();
		var resultTypes = await connection.request().query(queryTypes);

		//Get Asset Types list
		var queryPriorityTypes = tasks_query_provider.generatePrioritiesStatusQuery();
		var resultPriorityTypes = await connection.request().query(queryPriorityTypes);

		params.getTotalCount = true;
		query = tasks_query_provider.generateTasksQuery(params);
		result = await connection.request().query(query);
		totalRowsCount = result.recordset[0].totalCount;
		params.getTotalCount = false;

		params.getUrgentTasksCount = true;
		query = tasks_query_provider.generateTasksQuery(params);
		let resultUrgentTasks = await connection.request().query(query);
		let totalUrgentTasks = resultUrgentTasks.recordset[0].urgentTasks;
		params.getUrgentTasksCount = false;


		params.getUnsassignedTasks = true;
		query = tasks_query_provider.generateTasksQuery(params);
		let resultUnsassignedTasks = await connection.request().query(query);
		let unsassignedTasks = resultUnsassignedTasks.recordset[0].unassigned;
		params.getUnsassignedTasks = false;

		params.getUrgentUnsassignedTasks = true;
		query = tasks_query_provider.generateTasksQuery(params);
		let resultUrgentUnassignedTasks = await connection.request().query(query);
		let urgentUnassignedTasks = resultUrgentUnassignedTasks.recordset[0].urgentUnassigned;
		params.getUrgentUnsassignedTasks = false;

		query = tasks_query_provider.generateTasksQuery(params);
		result = await connection.request().query(query);

		connection.close();

		for(let i = 0; i < result.recordset.length; i++) {
			let task = result.recordset[i];
			let hiringClientId = result.recordset[i].HiringClientId;
			let subcontractorId = result.recordset[i].subcontractorId;
			if(task.assetTypeId == 1) {
				hiringClientId = task.assetId;
			}

			let hc_sc_pair = {};
			hc_sc_pair.hiringClientId = hiringClientId;
			hc_sc_pair.subcontractorId = subcontractorId;
			result.recordset[i].hc_sc_pair = hc_sc_pair;
		}

		var responseData = {};
		responseData.tasksList = result.recordset;

		responseData.ContactsTypesPossibleValues = resultContactsTypes.recordset;
		responseData.StatusPossibleValues = resultStatus.recordset;
		responseData.TaskTypesPossibleValues = resultTypes.recordset;
		responseData.PriorityPossibleValues = resultPriorityTypes.recordset;

		callback(null, responseData, totalRowsCount, totalUrgentTasks,unsassignedTasks,urgentUnassignedTasks);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.createTaskSimple = async function(params, callback) {
	let query = "";
	try {
    query = tasks_query_provider.generateTaskInsertSimpleQuery(params);
		// console.log(query);
		sql_helper.createTransaction(query, function(err) {
			if(err) {
				callback(err, query);
			}
		});
	}
	catch(err) {
		console.log(err);
	}
}

exports.createTask = async function(params, callback) {

	if (params.task.documentId) {
		await documentsHelper.getDocuments({
			documentId: params.task.documentId,
			getOne: true,
		}, (err, document) => {
			if (document.length > 0) {
				params.task.projectInsuredId = document[0].projectInsuredId;
				params.task.insuredId = document[0].SubcontractorID;
				params.task.assetId = document[0].SubcontractorID;
			}
		})
	}

	let query = tasks_query_provider.generateTaskInsertQuery(params.task);
	query = sql_helper.getLastIdentityQuery(query,'Tasks');

	sql_helper.createTransaction(query, function(err, result, taskId) {
		console.log('ERR', err, result, taskId);
		
		if(err) {
			console.log(err);
			return callback(err);
		}

		let locTaskId;
		locTaskId = taskId;

		callback(null, result, taskId);
		/*
		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: locTaskId
		}

		logger.addEntry(logParams, function (err, result) {
			if(err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			} else {
				console.log("Log succesfully created");
			}
			return;
		});
		*/
	});
}

exports.updateTask = async function(params, callback) {
	let query = "";

	query = tasks_query_provider.generateTaskUpdateQuery(params.task, params.userId);

	sql_helper.createTransaction(query, function(err, result, taskId) {
		if(err) {
			console.log(err);
			return callback(err);
		}

		let locTaskId;
		locTaskId = params.task.taskId;

		callback(null, result, locTaskId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: locTaskId
		}

		logger.addEntry(logParams, function (err, result) {
			if(err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			} else {
				console.log("Log succesfully created");
			}
			return;
		});
	});
}

exports.getTaskHistory = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();

		const query = tasks_query_provider.generateTaskHistoryQuery(params);
		const result = await connection.request().query(query);
		const taskHistory = result.recordset;

		let projectHistory=[];
		if (params.projectId) {
			const queryProjectHistory = tasks_query_provider.generateProjectHistoryQuery(params);
			const resultProjectHistory = await connection.request().query(queryProjectHistory);
			projectHistory = resultProjectHistory.recordset;
		}


		connection.close();
		callback(null, taskHistory, projectHistory);

	} catch (e) {
		callback(e, null);
	}
}

exports.createDataEntryTask = async (data) => {
	console.log('data entry task: ', data);

	let invalidData = false;
	if (!data) {
		invalidData = true;
	}

	if (data.holderId && (parseInt(data.holderId) <= 0 || isNaN(parseInt(data.holderId)))) invalidData = true;
	if (data.documentId && (parseInt(data.documentId) <= 0 || isNaN(parseInt(data.documentId)))) invalidData = true;
	if (data.projectId && (parseInt(data.projectId) <= 0 || isNaN(parseInt(data.projectId)))) invalidData = true;

	if (invalidData) return false;

	const documentParams = {
		getTotalCount: false,
		documentId: data.documentId,
	}

	let taskDescription = 'Document with deficiencies\n';

	const params = {
		statusId: 3, // open
		assetTypeId: 8, // Project/Insured
		tasksPriorityId: 2, // 2-normal
		dateDue: moment().format('YYYY-MM-DD'),
		holderId: data.holderId,
		documentId: data.documentId,
		projectId: data.projectId,
		assetId: data.projectId,
	}

	await this.getTaskTypeIdByName('Pending Cert Review', (err, taskType) => {
		if (err) {
			return null;
		}
		params.typeId = taskType[0].Id;
	});

	await documentsHelper.getDocuments(documentParams, (err, document, total) => {
		if (!err && document.length > 0) {
			const {FirstName, LastName, Email, SubcontractorID, projectInsuredId} = document[0];
			if (FirstName && LastName) taskDescription += `Uploaded by: ${FirstName}  ${LastName}\n`
			if (Email) taskDescription += `Email: ${Email}`
			params.projectInsuredId = projectInsuredId;
			params.insuredId = SubcontractorID;
			// console.log('document info: ', document[0].Email);
		}
	})

	params.description = taskDescription;


	const accountManagerResult =  await holderHelper.getHoldersAccountManager(data.holderId);
	if (accountManagerResult[0]) {
		const {accountManager, department, CFadmin} = accountManagerResult[0];
		if (accountManager) {
			params.assignedToUserId = accountManager;
		} else if(department) {
			params.departmentId = department
		} else {
			params.assignedToRoleId = CFadmin
		}
	}

	let query = tasks_query_provider.generateTaskInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Tasks');

	sql_helper.createTransaction(query, function(err, result, taskId) {
		if (err) {
			console.log(err);
			return false;
		}
		return taskId;


	});

}

exports.createDocumentTask = async (data) => {
	console.log('document task: ', data);

	let invalidData = false;
	if (!data) {
		invalidData = true;
	}

	if (data.hiringClientId && (parseInt(data.hiringClientId) <= 0 || isNaN(parseInt(data.hiringClientId)))) invalidData = true;
	if (data.documentId && (parseInt(data.documentId) <= 0 || isNaN(parseInt(data.documentId)))) invalidData = true;
	if (data.projectId && (parseInt(data.projectId) <= 0 || isNaN(parseInt(data.projectId)))) invalidData = true;

	if (invalidData) return false;

	const documentParams = {
		getTotalCount: false,
		documentId: data.documentId,
	}

	let taskDescription = 'Document for review\n';
	let subcontractorId = null;

	await documentsHelper.getDocuments(documentParams, (err, document, total) => {
		if (!err && document.length > 0) {
			const {FirstName, LastName, Email, SubcontractorID} = document[0];
			subcontractorId = SubcontractorID;
			if (FirstName && LastName) taskDescription += `Uploaded by: ${FirstName}  ${LastName}\n`
			if (Email) taskDescription += `Email: ${Email}`
			// console.log('document info: ', document[0].Email);
		}
	})

	const params = {
		description: taskDescription,
		statusId: 3, // open
		assetTypeId: 8, // Project/Insured
		tasksPriorityId: 2, // 2-normal
		dateDue: moment().format('YYYY-MM-DD'),
		holderId: data.hiringClientId,
		documentId: data.documentId,
		projectId: data.projectId,
		assetId: data.projectId,
		insuredId: subcontractorId,
		enteredByUserId: data.userId,
		modifyByUserId: data.userId,
	}

	await this.getTaskTypeIdByName('Pending Document Review', (err, taskType) => {
		if (err) {
			return null;
		}
		params.typeId = taskType[0].Id;
	});

	const accountManagerResult =  await holderHelper.getHoldersAccountManager(data.hiringClientId);
	if (accountManagerResult[0]) {
		const {accountManager, department, CFadmin} = accountManagerResult[0];
		if (accountManager) {
			params.assignedToUserId = accountManager;
		} else if(department) {
			params.departmentId = department
		} else {
			params.assignedToRoleId = CFadmin
		}
	}

	let query = tasks_query_provider.generateTaskInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Tasks');

	sql_helper.createTransaction(query, function(err, result, taskId) {
		console.log('taskId', err, result, taskId);		
		if (err) {
			console.log(err);
			return false;
		}
		return taskId;
	});
}

/**
 * Closes all tasks related to the document id
 */
exports.closeTasksByDocument = async (data) => {
	const connection = await sql_helper.getConnection();
	const tasksQuery = tasks_query_provider.generateCloseDocumentTasks(data.documentId);
	const tasksQueryResult = await connection.request().query(tasksQuery);
	const documentTasks = tasksQueryResult.recordset;

	if (documentTasks.length > 0) {
		documentTasks.map( async (task) => {
			const params = {
				taskId: task.Id,
				statusId: 2,
				description: 'Closed due document update',
				contactType: task.TypeId,
			}

			const query = tasks_query_provider.generateTaskUpdateQuery(params, data.userId);
			await connection.request().query(query);
		});
		return true
	}
	return false;
}

exports.getTaskTypeIdByName = async (name, callback) =>{
	try {
		const connection = await sql_helper.getConnection();

		const query = tasks_query_provider.generateTaskTypeIdByName(name);
		const result = await connection.request().query(query);
		const taskType = result.recordset;

		connection.close();
		callback(null, taskType);

	} catch (e) {
		callback(e, null);
	}
}