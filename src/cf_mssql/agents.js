const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const agentsQueryProvider = require('../cf_providers/agents_query_provider');

exports.getAgents = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = agentsQueryProvider.generateAgentsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = agentsQueryProvider.generateAgentsQuery(params);
			countResult = await connection.request().query(query);
			
			if(countResult.recordset.length > 0)
				totalCount = countResult.recordset.length;
		}
		//console.log('totalCount: '+ totalCount)
		connection.close();		
		callback(null, result.recordset, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createAgents = async (params, callback) => {	
	
	let query = agentsQueryProvider.generateAgentsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Agents');

	sql_helper.createTransaction(query, (err, result, agencyId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, agencyId);
	});
};

exports.updateAgents = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = agentsQueryProvider.generateAgentsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.agencyId);
	});
};

exports.removeAgents = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = agentsQueryProvider.generateAgentsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};