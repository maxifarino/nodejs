const error_helper = require('../helpers/error_helper');
const waiverLineItems = require('../cf_mssql/waiverLineItems');

exports.getWaiverLineItems = async (req, res) => {
	let queryParams = req.query || {};
	
	await waiverLineItems.getWaiverLineItems(queryParams, (err, waiverLineItems, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, waiverLineItems: waiverLineItems, totalCount: totalCount });
	});
};

exports.createWaiverLineItems = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}

	if(!params.waiverId || 
		 !params.projectInsuredDeficiencyId)
	{
		invalidData = true;
  }
	
	if(params.waiverId && (parseInt(params.waiverId) <= 0 || isNaN(parseInt(params.waiverId)))) invalidData = true;
	if(params.projectInsuredDeficiencyId && (parseInt(params.projectInsuredDeficiencyId) <= 0 || isNaN(parseInt(params.projectInsuredDeficiencyId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await waiverLineItems.createWaiverLineItems(params, (err, result, waiverLineItemId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true, data: { waiverLineItemId: waiverLineItemId } });
	});
};

exports.updateWaiverLineItems = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }

	if(!params.waiverId || (parseInt(params.waiverId) <= 0 || isNaN(parseInt(params.waiverId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await waiverLineItems.updateWaiverLineItems(params, (err, result, waiverLineItemId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { waiverLineItemId: waiverLineItemId } });
	});
};

exports.removeWaiverLineItems = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.waiverLineItemId || (parseInt(params.waiverLineItemId) <= 0 || isNaN(parseInt(params.waiverLineItemId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await waiverLineItems.removeWaiverLineItems(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};

exports.updateWaiverLineItems = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.waiverLineItemId || (parseInt(params.waiverLineItemId) <= 0 || isNaN(parseInt(params.waiverLineItemId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await waiverLineItems.updateWaiverLineItems(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};