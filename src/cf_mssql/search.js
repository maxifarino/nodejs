const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const searchQueryProvider = require('../cf_providers/search_query_provider');

exports.getData = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = getQueryProviderBySection(params.section, params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = getQueryProviderBySection(params.section, params);
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

getQueryProviderBySection = (section, params) => {
	let queryProvider;
	console.log('Section:', section, 'Params:', JSON.stringify(params, null, 2));
	switch (section) {
		case 'insureds':
				queryProvider = searchQueryProvider.generateInsuredsQuery(params);
			break;
		case 'projects':
			queryProvider = searchQueryProvider.generateProjectsQuery(params);
			break;
		case 'holders':
			queryProvider = searchQueryProvider.generateHoldersQuery(params);
			break;
		case 'contacts':
			queryProvider = searchQueryProvider.generateContactsQuery(params);
			break;
		case 'agencies':
			queryProvider = searchQueryProvider.generateAgenciesQuery(params);
			break;
	}
	return queryProvider;
};
