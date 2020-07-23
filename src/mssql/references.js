// Internal dependencies
// HELPERS
const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper')

// PROVIDERS
const query_provider = require('../providers/references_query_provider');

// FACADES
const logger = require('./log');


exports.getReferences = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let query;
		let result;
		let totalCount = 0;

		let typesQuery = query_provider.generateReferencesTypesQuery(params);
		let typesResult = await connection.request().query(typesQuery);

		let submissionsList = [];
		let questionsList = []

		if(params.subcontractorId) {
			let questionsQuery = query_provider.generateReferenceResponsesQuery(params);
			console.log(query);

			let questionsResult = await connection.request().query(questionsQuery);

			let submissionsQuery = query_provider.generateReferenceSubmissionsQuery(params);
			let submissionsResult = await connection.request().query(submissionsQuery);

			submissionsList = submissionsResult.recordset;
			questionsList = questionsResult.recordset;
		}


		params.getTotalCount=true;
		query = query_provider.generateReferenceQuery(params);
		result = await connection.request().query(query);
		totalCount = result.recordset[0].totalCount;

		params.getTotalCount=false;
		query = query_provider.generateReferenceQuery(params);		
		result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset, totalCount, typesResult.recordset, 
						 questionsList, submissionsList);
	}
	catch(err) {
		callback(err, null, null);
	}
}

exports.createReference = async function(params, callback) {
	let queryParams = params.reference;
	let query = query_provider.generateReferenceInsertQuery(queryParams);

	query = sql_helper.getLastIdentityQuery(query,'References');

	sql_helper.createTransaction(query, function(err, result, referenceId) {
		if(err) {
			return callback(err);
		}
		callback(null, result, referenceId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: referenceId
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

exports.updateReference = async function(params, callback) {
	let queryParams = params.reference;
	query = query_provider.generateReferenceUpdateQuery(queryParams);

	sql_helper.createTransaction(query, function(err, result) {
		if(err) {
			return callback(err);
		}
		callback(null, result);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: params.reference.referenceId
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

exports.createReferenceQuestion = async function(params, callback) {
	let queryParams = params.question;
	let query = query_provider.generateReferenceQuestionInsertQuery(queryParams);

	query = sql_helper.getLastIdentityQuery(query,'ReferenceQuestions');

	sql_helper.createTransaction(query, callback);
}

exports.updateReferenceQuestion = async function(params, callback) {
	let queryParams = params.question;
	let query = query_provider.generateReferenceQuestionUpdateQuery(queryParams);

	sql_helper.createTransaction(query, function(err, result) {
		if(err) {
			return callback(err);
		}
		callback(null, result);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: params.question.questionId
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

exports.getReferenceResponses = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();

		const query = query_provider.generateReferenceResponsesQuery(params);
		const result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset);
	}
	catch(err) {
		callback(err, null);
	}
}

exports.createReferenceResponse = async function(params, callback) {
	let queryParams = params.response;
	let query = query_provider.generateReferenceResponseInsertQuery(queryParams);

	query = sql_helper.getLastIdentityQuery(query,'ReferenceResponses');

	sql_helper.createTransaction(query, function(err, result, responseId) {
		if(err) {
			return callback(err);
		}
		callback(null, result, responseId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: responseId
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