const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const invoicePaymentsQueryProvider = require('../cf_providers/invoice_payments_query_provider');

exports.getInvoicePayments = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = invoicePaymentsQueryProvider.generateInvoicePaymentsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = invoicePaymentsQueryProvider.generateInvoicePaymentsQuery(params);
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

exports.createInvoicePayments = async (params, callback) => {	
	
	let query = invoicePaymentsQueryProvider.generateInvoicePaymentsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'Invoice_Payments');

	sql_helper.createTransaction(query, (err, result, invoicePaymentId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, invoicePaymentId);
	});
};

exports.updateInvoicePayments = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = invoicePaymentsQueryProvider.generateInvoicePaymentsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.invoicePaymentId);
	});
};

exports.removeInvoicePayments = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = invoicePaymentsQueryProvider.generateInvoicePaymentsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};