const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const projectinsured_tags_query_provider = require('../cf_providers/projectinsured_tags_query_provider');

exports.getProjectInsuredTags = async (params, callback) => {
	let allTagsListTotalCount = 0;
	let allTagsListResult = {};	
	let assignedTagsTotalCount = 0;
	let assignedTagsResult = {};
	const data = {};
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		const allTagsListQuery = projectinsured_tags_query_provider.generateAllTagsListQuery(params);
		allTagsListResult = await connection.request().query(allTagsListQuery);
		
		if(allTagsListResult.recordset.length > 0)
			allTagsListTotalCount = allTagsListResult.recordset.length;

		data.allTags = {
			data: allTagsListResult.recordset,
			totalCount: allTagsListTotalCount
		};		
		
		const assignedTagsQuery = projectinsured_tags_query_provider.generateProjectInsuredTagsQuery(params);
		assignedTagsResult = await connection.request().query(assignedTagsQuery);
		
		if(assignedTagsResult.recordset.length > 0)
			assignedTagsTotalCount = assignedTagsResult.recordset.length;

		data.assignedTags = {
			data: assignedTagsResult.recordset,
			totalCount: assignedTagsTotalCount
		};		
		
		connection.close();		
		callback(null, data);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createProjectInsuredTags = async (params, callback) => {	
	
	let query = projectinsured_tags_query_provider.generateProjectInsuredTagsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'ProjectInsureds_Tags');

	sql_helper.createTransaction(query, (err, result, projectInsuredTagId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, projectInsuredTagId);
	});
};

exports.removeProjectInsuredTags = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = projectinsured_tags_query_provider.generateProjectInsuredTagsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};