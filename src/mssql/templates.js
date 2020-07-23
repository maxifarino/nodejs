const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const query_provider = require('../providers/query_provider');
const logger = require('./log');

exports.getTemplates = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		const queryParams = {};

		if(params.templateId) {
			queryParams.templateId = params.templateId;
		}
		else if(params.communicationTypeId) {
			queryParams.communicationTypeId = params.communicationTypeId;
		}
		else if(params.hiringClientId) {
			queryParams.hiringClientId = params.hiringClientId;
		}
		else if(params.searchTerm) {
			queryParams.searchTerm = params.searchTerm;
		}

		if(params.pageSize && params.pageNumber) {
			queryParams.pagination = {}
			queryParams.pagination.pageSize = params.pageSize;
			queryParams.pagination.pageNumber = params.pageNumber;
		}

		if(params.orderBy) {
			queryParams.orderBy = params.orderBy;
		}

		if(params.orderDirection) {
			queryParams.orderDirection = params.orderDirection;
		}

		if(params.pageNumber) {
			queryParams.getTotalCount = true;
			var totalRowsCount = 0;
			var query = query_provider.generateTemplatesQuery(queryParams);
			var result = await connection.request().query(query);
			totalRowsCount = result.recordset.length;
		}

		queryParams.getTotalCount = false;
		query = query_provider.generateTemplatesQuery(queryParams);

		result = await connection.request().query(query);

		//Get CommunicationTypes list
		const queryCommunicationTypes = query_provider.generateCommunicationTypesQuery();
		const resultCommunicationTypes = await connection.request().query(queryCommunicationTypes);

		//Get TemplateActivities list
		const queryTemplateActivities = query_provider.generateTemplateActivitiesQuery();
		const resultTemplateActivities = await connection.request().query(queryTemplateActivities);

		connection.close();

		const responseData = {};
		responseData.templatesList = result.recordset;

		responseData.communicationTypesPossibleValues = resultCommunicationTypes.recordset;
		responseData.templateActivitiesPossibleValues = resultTemplateActivities.recordset;

		callback(null, responseData, totalRowsCount);
	}
	catch(err) {
		callback(err, null, null);
	}
}

exports.createOrUpdateTemplate = async function(params, callback) {
	if (params.templateId) {
		query = query_provider.generateTemplatesUpdateQuery(params);
	} else {
		query = query_provider.generateTemplatesInsertQuery(params);
		query = sql_helper.getLastIdentityQuery(query, 'MessagesTemplates');
	}

	sql_helper.createTransaction(query, function(err, result, templateId) {
		if(err) {
			return callback(err);
		}

		let locTemplateIdId = params.templateId || templateId;

		callback(null, result, locTemplateIdId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: locTemplateIdId
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

exports.getPlaceholders = async function(system, callback) {
	try {
		const connection = await sql_helper.getConnection();
		var query = query_provider.generatePlaceholdersQuery(system);
		var result = await connection.request().query(query);
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err)
		callback(err, null, null);
	}
}
