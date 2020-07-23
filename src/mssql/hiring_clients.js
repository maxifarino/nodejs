const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const query_provider = require('../providers/query_provider');
const logger = require('./log');
const { writeLog } = require('./../utils')

exports.createHiringClient = async function (params, callback) {
	let query = query_provider.generateHCInsertQuery(params);

	if (params.hiringClientId)
		query = query_provider.generateHCUpdateQuery(params);

	if (!params.hiringClientId)
		query = sql_helper.getLastIdentityQuery(query, 'HiringClients');

	sql_helper.createTransaction(query, function (err, result, hiringClientId) {
		if (err) {
			return callback(err);
		}

		let locHiringClientId = null;

		if (!params.hiringClientId) {
			locHiringClientId = hiringClientId;
		}
		else {
			locHiringClientId = params.hiringClientId
		}

		callback(null, result, hiringClientId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: hiringClientId
		}

		logger.addEntry(logParams, function (err, result) {
			if (err) {
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

exports.updateHiringClientName = async function (queryParams, logParams, callback) {
	try {

		const queryUpdateHCname = query_provider.generateUpdateHCnameQuery(queryParams);

		sql_helper.createTransaction(queryUpdateHCname, function (err) {
			if (err) {
				// console.log('????'.repeat(100))
				console.log('err in /mssql = ', err)
				// console.log('????'.repeat(100))
				callback(err);
			}

			const finalLogParams = {
				eventDescription: logParams.eventDescription,
				UserId: logParams.userId,
				Payload: queryParams.subcontractorId
			}

			logger.addEntry(finalLogParams, function (err, result) {
				if (err) {
					console.log("There was an error creating log for: ");
					console.log(finalLogParams);
					console.log(err);
				} else {
					console.log("Log succesfully created");
				}
				return;
			});

			callback(null);
		});

	}
	catch (err) {
		callback(err);
	}
}

exports.cloneHiringClientInitialConfigs = async function (hiringClientId, callback) {
	let query = query_provider.generateHCCloneConfigsQuery(hiringClientId);

	console.log(query);

	sql_helper.createTransaction(query, function (err, result, hiringClientId) {
		if (err) {
			return callback(err);
		}
		callback(null);
	});
}

exports.getHiringClientDetailSummary = async function (hiringClientId, subcontractorId, callback) {
	try {
		const connection = await sql_helper.getConnection();

		const query = query_provider.generateHiringClientSummaryQuery(hiringClientId, subcontractorId);

		const result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset);
	}
	catch (err) {
		callback(err, null);
	}
}

exports.getHiringClientSummaryWithFormFeesQuery = async function (hiringClientId, subcontractorId, callback) {
	try {
		const connection = await sql_helper.getConnection();

		const query = query_provider.generateHiringClientSummaryWithFormFeesQuery(hiringClientId, subcontractorId);
		console.log('QUERY', query);

		const result = await connection.request().query(query);
		connection.close();
		console.log('result', result);
		callback(null, result.recordset);
	}
	catch (err) {
		callback(err, null);
	}
}

exports.getHiringClientDetail = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();

		const query = query_provider.generateHiringClientDetailQuery(params);

		const result = await connection.request().query(query);
		connection.close();
		callback(null, result.recordset);
	}
	catch (err) {
		callback(err, null);
	}
}

exports.getHC_UnlinkedUsers = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();

		const query = query_provider.generateHC_UnlinkedUserQuery(params);

		const result = await connection.request().query(query);
		connection.close();

		if (result.recordset.length > 0) {
			callback(null, result.recordset);
		} else {
			console.log("No hiring client found.");
			callback(null, null);
		}
	}
	catch (err) {
		callback(err, null);
	}
}

exports.getHiringClientsForSC = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let queryParams = {}

		queryParams = params;

		if (params.pageSize && params.pageNumber) {
			queryParams.pagination = {}
			queryParams.pagination.pageSize = params.pageSize;
			queryParams.pagination.pageNumber = params.pageNumber;
		}

		if (params.pageNumber) {
			queryParams.getTotalCount = true;
			var totalRowsCount = 0;
			var query = query_provider.generateHiringClientsForSCQuery(queryParams);
			var result = await connection.request().query(query);
			totalRowsCount = result.recordset.length;
		}

		queryParams.getTotalCount = false;
		query = query_provider.generateHiringClientsForSCQuery(queryParams);
		result = await connection.request().query(query);

		// writeLog('mssql/hiring_clients, line 142, query = ', query)
		// writeLog('mssql/hiring_clients, line 142, queryParams = ', queryParams)

		connection.close();

		if (!params.pageNumber) {
			totalRowsCount = result.recordset.length;
		}

		if (result.recordset.length > 0) {
			callback(null, result.recordset, totalRowsCount);
		} else {
			console.log("No hiring client found.");
			callback(null, null, totalRowsCount);
		}
	}
	catch (err) {
		console.log(err);
		callback(err, null, null);
	}
}


exports.getHiringClients = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let queryParams = {}

		queryParams = params;
		if (params.pageSize && params.pageNumber) {
			queryParams.pagination = {}
			queryParams.pagination.pageSize = params.pageSize;
			queryParams.pagination.pageNumber = params.pageNumber;
		}

		if (params.pageNumber) {
			queryParams.getTotalCount = true;
			var totalRowsCount = 0;
			var query = query_provider.generateHiringClientsQuery(queryParams);

			var result = await connection.request().query(query);
			totalRowsCount = result.recordset.length;
		}

		queryParams.getTotalCount = false;
		query = query_provider.generateHiringClientsQuery(queryParams);
		result = await connection.request().query(query);

		connection.close();
		if (!params.pageNumber) {
			totalRowsCount = result.recordset.length;
		}

		if (result.recordset.length > 0) {
			callback(null, result.recordset, totalRowsCount);
		} else {
			console.log("No hiring client found.");
			callback(null, null, totalRowsCount);
		}
	}
	catch (err) {
		const date = (new Date).toLocaleString()
		console.log(`> Date: ${date}\n> Error: ${err}\n> Location: nodeapp/src/mssql/hiring_clients.js line 265`)
		callback(err, null, null);
	}
}

exports.getHiringClientsUsers = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		const queryParams = {}

		let query = `SELECT TOP 300 US.Id, US.FirstName, US.LastName, US.Mail `;
		query += `FROM Users_HiringClients UH, Users US `;
		query += `WHERE UH.HiringClientId =` + params.hiringClientId + ` `;
		query += `AND   UH.UserId = US.Id `;
		query += `ORDER BY US.FirstName ASC, US.LastName ASC `;

		const result = await connection.request().query(query);
		connection.close();

		if (result.recordset.length > 0) {
			callback(null, result.recordset);
		} else {
			console.log("No users found for the selected hiring client.");
			callback(null, null);
		}
	}
	catch (err) {
		callback(err, null);
	}
}

exports.getHiringClientsCount = async function (callback) {
	try {
		const connection = await sql_helper.getConnection();

		const query = query_provider.generateHiringClientsCountQuery();

		console.log("Atempting to retrieve hiring client count")
		const result = await connection.request().query(query);
		connection.close();

		if (result.recordset.length > 0) {
			callback(null, result.recordset[0].Count);
		} else {
			console.log("No hiring client found.");
			callback(null, null);
		}
	}
	catch (err) {
		callback(err, null);
	}
}

exports.linkHiringClientAndUser = async function (params, callback) {
	try {
		let query = `
				DECLARE @exists INT;
				SELECT @exists = COUNT(*)
				FROM Users_HiringClients
				WHERE userId = ${params.userId}
				AND hiringClientId = ${params.hiringClientId}

				IF @exists = 0
				BEGIN
							INSERT INTO Users_HiringClients (UserId, HiringClientId) VALUES ( `;
		query += params.userId + `, `;
		query += params.hiringClientId + `);
				END `;

		sql_helper.createTransaction(query, callback);
	}
	catch (err) {
		callback(err, null);
	}
}

exports.updateUserRelation = async function (params, callback) {
	let queryParams = params.relations;
	let query = query_provider.generateHiringClientUpdateUserRelationsQuery(queryParams);

	sql_helper.createTransaction(query, function (err, result) {
		if (err) {
			return callback(err);
		}
		callback(null, result);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: params.relations.userId
		}

		logger.addEntry(logParams, function (err, result) {
			if (err) {
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

exports.getHiringClientsBySubContractor = async function (params, callback) {

	try {
		const connection = await sql_helper.getConnection();
		let query = `select Id,Name from Hiringclients where id in
					 (SELECT distinct HiringClientId FROM Hiringclients_SubContractors
					   where SubContractorId=${params.query.scId}
					    AND HiringClientId <> ${params.query.hcId}
						AND HiringClientId IN
						(SELECT HiringClientId FROM SavedForms
							WHERE SubcontractorID = ${params.query.scId}
							AND HiringClientId <> ${params.query.hcId}
							AND IsComplete = 1
							AND DATEDIFF(dd, dateOfPrequal, GETDATE()) < 180
							AND (isCopied is null or isCopied= 0)))`;

		var result = await connection.request().query(query);
		connection.close();
		callback(null, result.recordset);
	}
	catch (err) {
		const date = (new Date).toLocaleString()
		console.log(`> Date: ${date}\n> Error: ${err}\n> Location: nodeapp/src/mssql/hiring_clients.js line 380`)
		callback(err, null, null);
	}
}

exports.getFormByHiringClients = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let query = `select * from Forms where HiringClientId=${params.query.hcId}`;

		var result = await connection.request().query(query);
		connection.close();
		callback(null, result.recordset);
	}
	catch (err) {
		const date = (new Date).toLocaleString()
		console.log(`> Date: ${date}\n> Error: ${err}\n> Location: nodeapp/src/mssql/hiring_clients.js line 380`)
		callback(err, null, null);
	}
}

exports.getSubmissionsByFormId = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let query = query_provider.getSubmissionsByFormIdQuery(params.query);

		var result = await connection.request().query(query);
		connection.close();
		callback(null, result.recordset);
	}
	catch (err) {
		const date = (new Date).toLocaleString()
		console.log(`> Date: ${date}\n> Error: ${err}\n> Location: nodeapp/src/mssql/hiring_clients.js line 380`)
		callback(err, null, null);
	}
}