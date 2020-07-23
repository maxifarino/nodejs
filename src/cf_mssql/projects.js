const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const projects_query_provider = require('../cf_providers/projects_query_provider');

exports.getFavorite = async function (params, callback) {
	console.log('params', params);
	try {
		const connection = await sql_helper.getConnection();

		let query = `SELECT * FROM UsersProjects_Favorites `;
		if (params.userId)
			query += ` WHERE usersId = ${params.userId}`;
		if (params.userId && params.projectId)
			query += ` AND projectId = ${params.projectId}`;

		console.log('QUERY::', query);
		result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

exports.addFavorite = async function (params, callback) {
	console.log('params', params);
	try {
		const connection = await sql_helper.getConnection();

		let query = `INSERT INTO UsersProjects_Favorites (`
		if (params.userId)
			query += `usersId`;
		if (params.projectId)
			query += `, projectId`;

		query += `) VALUES (`;

		if (params.userId)
			query += ` ${params.userId}`;
		if (params.projectId)
			query += `, ${params.projectId}`;

		query += `)`;
		console.log('QUERY::', query);

		result = await connection.request().query(query);
		connection.close();

		callback(null, true);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

exports.removeFavorite = async function (params, callback) {
	console.log('params', params);
	try {
		const connection = await sql_helper.getConnection();

		let query = `DELETE UsersProjects_Favorites WHERE `
		if (params.userId)
			query += ` usersId = ${params.userId}`;
		if (params.projectId)
			query += ` AND projectId = ${params.projectId}`;

		console.log('QUERY::', query);

		result = await connection.request().query(query);
		connection.close();

		callback(null, true);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
};

exports.getProjects = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();

		var query = {};
		var result = {};
		var totalCount = 0;
		var amountProjectsNonArchive = 0;
		// Check if user is HL

		// query = projects_query_provider.generateGetRoleIsHLQuery(params.loggedUserId);
		// result = await connection.request().query(query);

		// if (result.recordset.length) {
		//   let IsCFRole = result.recordset[0].IsCFRole == 1;
		//   let IsHLRole = result.recordset[0].IsHLRole == 1;
		//   let IsINRole = result.recordset[0].IsINRole == 1;
		//   let IsAMRole = result.recordset[0].IsAMRole == 1;
		//   params.IsCFRole = IsCFRole;
		//   params.IsHLRole = IsHLRole;
		//   params.IsINRole = IsINRole;
		// 	params.IsAMRole = IsAMRole;

		if (params.pageSize) {
			params.getTotalCount = true;
			query = projects_query_provider.generateProjectsQuery(params);
			result = await connection.request().query(query);
			totalCount = result.recordset[0].totalCount;
		}

		if (params.holderId) {
			query = projects_query_provider.generateAmountProjectNonArchiveQuery(params.holderId);
			result = await connection.request().query(query);
			amountProjectsNonArchive = result.recordset[0].total;
		}
		
		params.getTotalCount = false;
		query = projects_query_provider.generateProjectsQuery(params);
		result = await connection.request().query(query);
		connection.close();

		if (!params.pageSize) {
			totalCount = result.recordset.length;
		}

		// }
		callback(null, result.recordset, totalCount, amountProjectsNonArchive);
	}
	catch (err) {
		console.log(err);
		callback(err, null, null);
	}
}

exports.getProjectDetail = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();

		var query = {};
		var result = {};
		// Check if user is HL

		query = projects_query_provider.generateProjectsDetailQuery(params);
		project = await connection.request().query(query);
		connection.close();
		console.log('project', project);

		callback(null, project.recordset);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.createProject = async function (params, callback) {

	let query = projects_query_provider.generateProjectInsertQuery(params);

	query = sql_helper.getLastIdentityQuery(query, 'Projects');

	sql_helper.createTransaction(query, function (err, result, projectId) {
		if (err) {
			return callback(err);
		}
		callback(null, result, projectId);
	});
}

exports.updateProject = async function (params, callback) {

	let query = projects_query_provider.generateProjectUpdateQuery(params);

	sql_helper.createTransaction(query, function (err, result, projectId) {
		if (err) {
			return callback(err);
		}
		callback(null, result, params.id);
	});
}