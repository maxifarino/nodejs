const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const invoiceLineItemsQueryProvider = require('../cf_providers/invoice_lineitems_query_provider');

exports.getInvoiceLineItems = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = invoiceLineItemsQueryProvider.generateInvoiceLineItemsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = invoiceLineItemsQueryProvider.generateInvoiceLineItemsQuery(params);
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

exports.createInvoiceLineItems = async (params, callback) => {	
	
	let query = invoiceLineItemsQueryProvider.generateInvoiceLineItemsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'InvoiceLineItems');

	sql_helper.createTransaction(query, (err, result, invoiceLineItemId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, invoiceLineItemId);
	});
};

exports.updateInvoiceLineItems = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = invoiceLineItemsQueryProvider.generateInvoiceLineItemsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.invoiceLineItemId);
	});
};

exports.removeInvoiceLineItems = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = invoiceLineItemsQueryProvider.generateInvoiceLineItemsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};