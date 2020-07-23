const refunds = require('../cf_mssql/refunds');
const error_helper = require('../helpers/error_helper');

exports.getRefunds = async (req, res) => {
	let queryParams = req.query || {};
  await refunds.getRefunds(queryParams, (err, refunds, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: refunds, totalCount: totalCount });
	});
};

exports.createRefunds = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(!params.paymentId || (parseInt(params.paymentId) <= 0 || isNaN(parseInt(params.paymentId)))) invalidData = true;
	if(!params.refundAmount || (parseInt(params.refundAmount) <= 0 || isNaN(parseInt(params.refundAmount)))) invalidData = true;
	if(!params.refundMethodById || (parseInt(params.refundMethodById) <= 0 || isNaN(parseInt(params.refundMethodById)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

	// Created by
	params.refundCreatedById = req.currentUser.Id;

	if (!params.refundId || (parseInt(params.refundId) <= 0 || isNaN(parseInt(params.refundId)))) {
		
		await refunds.createRefunds(params, (err, result, refundId) => {
			if(err) {
				error = error_helper.getSqlErrorData(err);
				return res.send(error);
			}
	
			return res.status(200).json({ success: true, refundId: refundId });
		});
	
	} else {

		await refunds.updateRefunds(params, (err, result, refundId) => {
			if(err) {
				error = error_helper.getSqlErrorData(err);
				return res.send(error);
			}
		
			return res.status(200).json({ success: true, data: { refundId: refundId } });
		});
	}
};

exports.removeRefunds = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
	if(!params.refundId || (parseInt(params.refundId) <= 0 || isNaN(parseInt(params.refundId)))) invalidData = true;
  	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await refunds.removeRefunds(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};