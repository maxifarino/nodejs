const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const scApplicationsQueryProvider = require('../providers/subcontractors_applications_query_provider');
const queryProvider = require('../providers/query_provider');
const hiringClientsController = require('../api/hiring_clients');

exports.getSCApplications = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = scApplicationsQueryProvider.generateSCApplicationsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		// if (params.pageSize) {
		// 	params.getTotalCount = true;
		// 	query = scApplicationsQueryProvider.generateSCApplicationsQuery(params);
		// 	countResult = await connection.request().query(query);
			
		// 	if(countResult.recordset.length > 0)
		// 		totalCount = countResult.recordset.length;
		// }
		//console.log('totalCount: '+ totalCount)
		connection.close();		
		callback(null, result.recordset, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createSCApplications = async (params, callback) => {	
	
	let query = scApplicationsQueryProvider.generateSCApplicationsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Applications');

	sql_helper.createTransaction(query, (err, result, scApplicationId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, scApplicationId);
	});
};

exports.removeSCApplications = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = scApplicationsQueryProvider.generateSCApplicationsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.checkSC = async (params, callback) => {
	let result = {};
  try {		
		const connection = await sql_helper.getConnection();		
		let query = scApplicationsQueryProvider.generateCheckSCApplicationsQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.getHCConfig = async (params, callback) => {
	let result = {};
  try {		
		const connection = await sql_helper.getConnection();		
		let query = scApplicationsQueryProvider.generateGetHCConfigApplicationsQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createSC = async (params, callback) => {

	let query = scApplicationsQueryProvider.generateSCInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'SubContractors');

	sql_helper.createTransaction(query, (err, result, scId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, scId);
	});
};

exports.createSClocation = async (params, callback) => {

	const query = `exec sp_insert_update_locationbyID ${params.scId}, 
                                                    0, 
                                                    1,
                                                    '${params.address}',
                                                    '${params.city}',
                                                    '${params.state}',
                                                    '${params.zipcode}',
                                                    ${params.countryId},
                                                    NULL,
                                                    1,
                                                    '${params.subcontractorContactPhone}',
                                                    NULL,
                                                    '${params.subcontractorContactName}',
                                                    '${params.subcontractorContactEmail}'`

  // console.log('query = ', query)

	sql_helper.createTransaction(query, (err, result, locationID) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, locationID);
	});
};

exports.associateSC = async (params, callback) => {
	// console.log("params SC", params);
	let query = scApplicationsQueryProvider.generateSCHCInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Hiringclients_SubContractors');

	sql_helper.createTransaction(query, (err, result, hcScId) => {
		// console.log("result SC", result, hcScId);
		if(err) {
			return callback(err);
		}
		callback(null, result, hcScId);
	});
};

exports.approveSCApplications = async (params, callback) => {
	let query = scApplicationsQueryProvider.generateSCApplicationsApproveQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
		}
		callback(null, result);
	});
};

exports.declineSCApplications = async (params, callback) => {
	let query = scApplicationsQueryProvider.generateSCApplicationsDeclineQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
		}
		callback(null, result);
	});
};

exports.checkHC = async (params, callback) => {
	let result = {};
  try {		
		const connection = await sql_helper.getConnection();		
		let query = scApplicationsQueryProvider.generateCheckHCQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;

		connection.close();		

		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.getResources = async function(queryParams, callback) {
	try {
		let hiringClientId = queryParams.hiringClientId;

		const connection = await sql_helper.getConnection();
		let queryTR = null;
		let resultTR = null;
		let queryTT = null;
		let resultTT = null;
		let queryCountries = null;
		let resultCountries = null;

		queryTR = queryProvider.generateTradesQuery(hiringClientId);
		resultTR = await connection.request().query(queryTR);

		queryTT = queryProvider.generateTitlesQuery();
		resultTT = await connection.request().query(queryTT);

		queryCountries = queryProvider.generateCountriesQuery();
		resultCountries = await connection.request().query(queryCountries);
		
		connection.close();

		let data = {};

		// Add hc data
		data.hiringClientId = hiringClientId;
			
		// Add timezones
		// if(resultTZ.recordset.length > 0) {
		//	 data.timeZones = resultTZ.recordset;
		// }

		// Add trades
		if(resultTR.recordset.length > 0) {
			data.trades = resultTR.recordset;
		}

		// Add titles
		if(resultTT.recordset.length > 0) {
			data.titles = resultTT.recordset;
		}

		data.countries = resultCountries.recordset;

		// Add HC logo
		await hiringClientsController.getLogo(hiringClientId, function(err, resultLogo) {
			if(err) {
				console.log(err);
				data.logo = '';
			}
			else {
				data.logo = resultLogo;
			}
			callback(null, data);
		});
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}



exports.checkUser = async (params, callback) => {
	let result = {};
  try {		
		const connection = await sql_helper.getConnection();		
		let query = scApplicationsQueryProvider.generateCheckUserApplicationsQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createUser = async (params, callback) => {

	let query = scApplicationsQueryProvider.generateUserInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Users');

	sql_helper.createTransaction(query, (err, result, userId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, userId);
	});
};

exports.associateUserSC = async (params, callback) => {
		
	let query = scApplicationsQueryProvider.generateUserSCInsertQuery(params);
	console.log("associateUserSC");
	query = sql_helper.getLastIdentityQuery(query,'Users_SubContractors');

	sql_helper.createTransaction(query, (err, result, userScId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, userScId);
	});
};


exports.getDefaulForm = async (params, callback) => {

	let result = {};
  try {		
		const connection = await sql_helper.getConnection();		
		let query = `SELECT id FROM Forms WHERE HiringClientID = ${params.hcId} and IsDefault = 1`;
		result = await connection.request().query(query);
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.savedForms = async (params, callback) => {
	console.log("saverForm", params);
		
	let query = scApplicationsQueryProvider.generateInsertSavedFormQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'SavedForms');

	sql_helper.createTransaction(query, (err, result, userScId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, userScId);
	});
};
