const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const certUploadQueryProvider = require('../cf_providers/certupload_query_provider');

exports.validateHash = async (params, callback) => {
	let totalCount = 0;
  try {		
		const connection = await sql_helper.getConnection();		
		let query = certUploadQueryProvider.generateValidateHashQuery(params);
		let result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
			
    connection.close();		
		callback(null, result.recordset, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};    


// exports.getAgencies = async (params, callback) => {
// 	let totalCount = 0;
// 	let countResult = 0;
// 	let result = {};	
// 	params.getTotalCount = false;

//   try {		
// 		const connection = await sql_helper.getConnection();		
// 		let query = agenciesQueryProvider.generateAgenciesQuery(params);
// 		result = await connection.request().query(query);
		
// 		if(result.recordset.length > 0)
// 			totalCount = result.recordset.length;
// 		//console.log('Result: '+result.recordset)

// 		if (params.pageSize) {
// 			params.getTotalCount = true;
// 			query = agenciesQueryProvider.generateAgenciesQuery(params);
// 			countResult = await connection.request().query(query);
			
// 			if(countResult.recordset.length > 0)
// 				totalCount = countResult.recordset.length;
// 		}
// 		//console.log('totalCount: '+ totalCount)
// 		connection.close();		
// 		callback(null, result.recordset, totalCount);
// 	}
// 	catch(err) {
// 		console.log(err);
// 		callback(err, null);
// 	}
// };