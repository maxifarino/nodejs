const invoicePayments = require('../cf_mssql/invoicePayments');
const error_helper = require('../helpers/error_helper');

exports.getInvoicePayments = async (req, res) => {
	let queryParams = req.query || {};
  await invoicePayments.getInvoicePayments(queryParams, (err, invoicePayments, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: invoicePayments, totalCount: totalCount });
	});
};

exports.createInvoicePayments = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.invoiceId || (parseInt(params.invoiceId) <= 0 || isNaN(parseInt(params.invoiceId)))) invalidData = true;
	if(!params.paymentId || (parseInt(params.paymentId) <= 0 || isNaN(parseInt(params.paymentId)))) invalidData = true;
	if(!params.appliedAmount || (parseInt(params.appliedAmount) <= 0 || isNaN(parseInt(params.appliedAmount)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

	// Applied by
	params.appliedById = req.currentUser.Id;

	if (!params.invoicePaymentId || 
			(parseInt(params.invoicePaymentId) <= 0 || isNaN(parseInt(params.invoicePaymentId)))
		)		
	{
		
		await invoicePayments.createInvoicePayments(params, (err, result, invoicePaymentId) => {
			if(err) {
				error = error_helper.getSqlErrorData(err);
				return res.send(error);
			}
	
			return res.status(200).json({ success: true, invoicePaymentId: invoicePaymentId });
		});
	
	} else {

		await invoicePayments.updateInvoicePayments(params, (err, result, invoicePaymentId) => {
			if(err) {
				error = error_helper.getSqlErrorData(err);
				return res.send(error);
			}
		
			return res.status(200).json({ success: true, data: { invoicePaymentId: invoicePaymentId } });
		});
	}
};

exports.removeInvoicePayments = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
	if (!params.invoicePaymentId || 
		(parseInt(params.invoicePaymentId) <= 0 || isNaN(parseInt(params.invoicePaymentId)))
	)	{
		invalidData = true;
	}
  	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await invoicePayments.removeInvoicePayments(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};