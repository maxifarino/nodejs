const payments = require('../cf_mssql/payments');
const error_helper = require('../helpers/error_helper');

exports.getPayments = async (req, res) => {
	let queryParams = req.query || {};
  await payments.getPayments(queryParams, (err, payments, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: payments, totalCount: totalCount });
	});
};

exports.createPayments = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.paymentAmount || (parseInt(params.paymentAmount) <= 0 || isNaN(parseInt(params.paymentAmount)))) invalidData = true;
	if(!params.insuredId || (parseInt(params.insuredId) <= 0 || isNaN(parseInt(params.insuredId)))) invalidData = true;
	if(!params.paymentMethodId || (parseInt(params.paymentMethodId) <= 0 || isNaN(parseInt(params.paymentMethodId)))) invalidData = true;
	if(!params.checkNumber || (parseInt(params.checkNumber) <= 0 || isNaN(parseInt(params.checkNumber)))) invalidData = true;
	if(!params.cardTypeId || (parseInt(params.cardTypeId) <= 0 || isNaN(parseInt(params.cardTypeId)))) invalidData = true;
	if(!params.creditCardShortNumber || (parseInt(params.creditCardShortNumber) <= 0 || isNaN(parseInt(params.creditCardShortNumber)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

  await payments.createPayments(params, (err, result, paymentId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, paymentId: paymentId });
	});
};

exports.removePayments = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
	if(!params.paymentId || (parseInt(params.paymentId) <= 0 || isNaN(parseInt(params.paymentId)))) invalidData = true;
  	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await payments.removePayments(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};