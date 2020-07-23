const invoiceLineItems = require('../cf_mssql/invoiceLineItems');
const error_helper = require('../helpers/error_helper');

exports.getInvoiceLineItems = async (req, res) => {
	let queryParams = req.query || {};
  await invoiceLineItems.getInvoiceLineItems(queryParams, (err, invoiceLineItems, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: invoiceLineItems, totalCount: totalCount });
	});
};

exports.createInvoiceLineItems = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.invoiceId || (parseInt(params.invoiceId) <= 0 || isNaN(parseInt(params.invoiceId)))) invalidData = true;
	if(!params.quantity || (parseInt(params.quantity) <= 0 || isNaN(parseInt(params.quantity)))) invalidData = true;
	if(!params.unitPrice || (parseInt(params.unitPrice) <= 0 || isNaN(parseInt(params.unitPrice)))) invalidData = true;
	if(!params.expenseTypeId || (parseInt(params.expenseTypeId) <= 0 || isNaN(parseInt(params.expenseTypeId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

	if (!params.invoiceLineItemId || 
			(parseInt(params.invoiceLineItemId) <= 0 || isNaN(parseInt(params.invoiceLineItemId)))
		)		
	{
		
		await invoiceLineItems.createInvoiceLineItems(params, (err, result, invoiceLineItemId) => {
			if(err) {
				error = error_helper.getSqlErrorData(err);
				return res.send(error);
			}
	
			return res.status(200).json({ success: true, invoiceLineItemId: invoiceLineItemId });
		});
	
	} else {

		await invoiceLineItems.updateInvoiceLineItems(params, (err, result, invoiceLineItemId) => {
			if(err) {
				error = error_helper.getSqlErrorData(err);
				return res.send(error);
			}
		
			return res.status(200).json({ success: true, data: { invoiceLineItemId: invoiceLineItemId } });
		});
	}
};

exports.removeInvoiceLineItems = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
	if (!params.invoiceLineItemId || 
		(parseInt(params.invoiceLineItemId) <= 0 || isNaN(parseInt(params.invoiceLineItemId)))
	)		
	{
		invalidData = true;
	}
  	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await invoiceLineItems.removeInvoiceLineItems(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};