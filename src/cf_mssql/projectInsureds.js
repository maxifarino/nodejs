const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const projectInsuredsQueryProvider = require('../cf_providers/projectinsureds_query_provider');

exports.getProjectInsureds = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};
	let processedResult = [];
	params.getTotalCount = false;
	let totalProjectNonArchived = 0;

	try {

		const connection = await sql_helper.getConnection();
		let query = projectInsuredsQueryProvider.generateProjectInsuredsQuery(params);
		if (params.summary) {
			query = projectInsuredsQueryProvider.generateProjectInsuredsSummaryQuery(params);
		}
		result = await connection.request().query(query);

		if (result.recordset.length > 0)
			totalCount = result.recordset.length;

		// Only available without summary param
		if (params.pageSize && !params.summary) {
			params.getTotalCount = true;
			query = projectInsuredsQueryProvider.generateProjectInsuredsQuery(params);
			countResult = await connection.request().query(query);

			if (countResult.recordset.length > 0)
				totalCount = countResult.recordset.length;
		}

		if (params.insuredId) {
			query = projectInsuredsQueryProvider.countProjectsNonArchived(params.insuredId);
			countResult = await connection.request().query(query);
			totalProjectNonArchived = countResult.recordset[0].count;
		}

		connection.close();
		callback(null, result.recordset, totalCount, totalProjectNonArchived);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createProjectInsureds = async (params, callback) => {
	const connection = await sql_helper.getConnection();
	let query = projectInsuredsQueryProvider.checkIfProjectInsuredExists(params.projectId, params.insuredId);
	let result = await connection.request().query(query);

	if (result.recordset.length > 0) {
		return callback('exists');
	}

	query = projectInsuredsQueryProvider.generateProjectInsuredsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query, 'ProjectsInsureds');

	sql_helper.createTransaction(query, (err, result, projectInsuredId) => {
		if (err) {
			return callback(err);
		}
		callback(null, result, projectInsuredId);
	});
};

exports.updateProjectInsureds = async (params, callback) => {
	let query = projectInsuredsQueryProvider.generateProjectInsuredsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if (err) {
			return callback(err);
		}
		callback(null, result, params.projectInsuredId);
	});
};

exports.removeProjectInsureds = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
		let query = projectInsuredsQueryProvider.generateProjectInsuredsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();
		callback(null, true);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

exports.archiveProjectInsureds = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
		let query = projectInsuredsQueryProvider.archiveProjectInsuredsQueryUpdate(params);
		result = await connection.request().query(query);
		connection.close();
		callback(null, true);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

exports.exemptProjectInsureds = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
		let query = projectInsuredsQueryProvider.exemptProjectInsuredsQueryUpdate(params);
		result = await connection.request().query(query);
		connection.close();
		callback(null, true);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createProjectInsuredsCertificate = async (params, callback) => {
	const connection = await sql_helper.getConnection();
	let query = projectInsuredsQueryProvider.checkIfProjectInsuredCertificateExists(params.projectInsuredId, params.certificateId);
	let result = await connection.request().query(query);

	if (result.recordset.length > 0) {
		return callback('exists');
	}

	query = projectInsuredsQueryProvider.generateProjectInsuredsCertificateInsertQuery(params);
	//query = sql_helper.getLastIdentityQuery(query, 'ProjectInsureds_CertificateOfInsurance');

	sql_helper.createTransaction(query, (err, result) => {
		if (err) {
			return callback(err);
		}
		callback(null, result);
	});
};



exports.updateComplianceStatusProjectInsureds = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
		let query = projectInsuredsQueryProvider.generateProjectInsuredsUpdateQuery(params);
		result = await connection.request().query(query);
		connection.close();
		callback(null, true);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

exports.getProjectInsuredsSimple = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
		let query = projectInsuredsQueryProvider.generateProjectInsuredsSimpleQuery(params);
		result = await connection.request().query(query);
		connection.close();
		callback(null, result.recordset[0]);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};
