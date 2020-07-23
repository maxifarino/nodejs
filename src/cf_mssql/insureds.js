const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const insureds_query_provider = require('../cf_providers/insureds_query_provider');

exports.getInsureds = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};
	params.getTotalCount = false;

	try {
		const connection = await sql_helper.getConnection();
		let query = (params.shallow)
			? insureds_query_provider.generateInsuredsShallowQuery(params)
			: insureds_query_provider.generateInsuredsQuery(params);
		result = await connection.request().query(query);

		if (result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = (params.shallow)
				? insureds_query_provider.generateInsuredsShallowQuery(params)
				: insureds_query_provider.generateInsuredsQuery(params);
			countResult = await connection.request().query(query);

			if (countResult.recordset.length > 0)
				totalCount = countResult.recordset.length;
		}
		//console.log('totalCount: '+ totalCount)
		connection.close();
		callback(null, result.recordset, totalCount);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createInsureds = async (params, callback) => {

	let query = insureds_query_provider.generateInsuredsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query, 'SubContractors');

	sql_helper.createTransaction(query, (err, result, insuredId) => {
		if (err) {
			return callback(err);
		}
		callback(null, result, insuredId);
	});
};

exports.updateInsureds = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = insureds_query_provider.generateInsuredsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if (err) {
			return callback(err);
		}
		callback(null, result, params.insuredId);
	});
};

exports.removeInsureds = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
		let query = insureds_query_provider.generateInsuredsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();
		callback(null, true);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

exports.archiveInsureds = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
		let query = insureds_query_provider.generateInsuredArchiveQuery(params);
		result = await connection.request().query(query);
		connection.close();
		callback(null, true);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

// Hiringclients_SubContractors
exports.getInsuredsByHolder = async (params, callback) => {
	let result = {};
	try {
		const connection = await sql_helper.getConnection();
		let query = insureds_query_provider.generateInsuredsByHolderQuery(params);
		result = await connection.request().query(query);
		connection.close();
		callback(null, result.recordset);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

exports.removeInsuredHolders = async (params, callback) => {
	let query = insureds_query_provider.generateInsuredHoldersDeleteQuery(params);
	sql_helper.createTransaction(query, (err, result) => {
		if (err) {
			return callback(err);
		}
		callback(null, result);
	});
};

exports.associateInsuredToHolder = async (params, callback) => {
	let query = insureds_query_provider.generateAssociateInsuredToHolderQuery(params);
	sql_helper.createTransaction(query, (err, result) => {
		if (err) {
			return callback(err);
		}
		callback(null, result);
	});
};
