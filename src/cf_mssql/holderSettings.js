const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const holderSettingsQueryProvider = require('../cf_providers/holdersettings_query_provider');

exports.getHolderSettings = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = holderSettingsQueryProvider.generateHolderSettingsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = holderSettingsQueryProvider.generateHolderSettingsQuery(params);
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

exports.updateHolderSettings = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = holderSettingsQueryProvider.generateHolderSettingsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.holderId);
	});
};

exports.getHolderSettingsDataEntryOptions = async (params, callback) => {
	let result = {};

  try {		
		const connection = await sql_helper.getConnection();		
		let query = holderSettingsQueryProvider.generateHolderSettingsDataEntryOptionsQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.getHolderSettingsCertificateOptions = async (params, callback) => {
	let result = {};
	
  try {		
		const connection = await sql_helper.getConnection();		
		let query = holderSettingsQueryProvider.generateHolderSettingsCertificateOptionsQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};