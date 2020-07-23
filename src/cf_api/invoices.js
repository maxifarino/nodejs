const invoices = require('../cf_mssql/invoices');
const error_helper = require('../helpers/error_helper');

exports.getInvoices = async (req, res) => {
	let queryParams = req.query || {};
  await invoices.getInvoices(queryParams, (err, invoices, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: invoices, totalCount: totalCount });
	});
};

exports.createInvoices = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.invoiceAmount || (parseInt(params.invoiceAmount) <= 0 || isNaN(parseInt(params.invoiceAmount)))) invalidData = true;
	if(!params.insuredId || (parseInt(params.insuredId) <= 0 || isNaN(parseInt(params.insuredId)))) invalidData = true;
	if(!params.invoiceStatusId || (parseInt(params.invoiceStatusId) <= 0 || isNaN(parseInt(params.invoiceStatusId)))) invalidData = true;
	if(!params.outstandingBalance || (parseInt(params.outstandingBalance) <= 0 || isNaN(parseInt(params.outstandingBalance)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

	// Created by
	params.createdBy = req.currentUser.Id;

  await invoices.createInvoices(params, (err, result, invoiceId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, invoiceId: invoiceId });
	});
};

exports.removeInvoices = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
	if(!params.invoiceId || (parseInt(params.invoiceId) <= 0 || isNaN(parseInt(params.invoiceId)))) invalidData = true;
  	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await invoices.removeInvoices(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};

exports.getFinance = async (req, res) => {
	let queryParams = req.query || {};
	var invalidData = false;

	if(!queryParams.insuredId || (parseInt(queryParams.insuredId) <= 0 || isNaN(parseInt(queryParams.insuredId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await invoices.getFinance(queryParams, (err, finance, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: finance, totalCount: totalCount });
	});
};