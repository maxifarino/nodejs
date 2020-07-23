const error_helper = require('../helpers/error_helper');
const waivers = require('../cf_mssql/waivers');

exports.getWaivers = async (req, res) => {
	let queryParams = req.query || {};
	
	await waivers.getWaivers(queryParams, (err, waivers, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, waivers: waivers, totalCount: totalCount });
	});
};

exports.createWaivers = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}

	if(!params.projectInsuredId) invalidData = true;
	if(!params.waiverCreatedById) params.waiverCreatedById = req.currentUser.Id;
	
	if(params.projectInsuredId && (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;
	if(params.waiverCreatedById && (parseInt(params.waiverCreatedById) <= 0 || isNaN(parseInt(params.waiverCreatedById)))) invalidData = true;
	
	console.log('PARAMS', params);
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await waivers.createWaivers(params, (err, result, waiverId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true, data: { waiverId: waiverId } });
	});
};

exports.removeWaivers = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.waiverId || (parseInt(params.waiverId) <= 0 || isNaN(parseInt(params.waiverId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await waivers.removeWaivers(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};

exports.getWaiversDetail = async (req, res) => {
	let queryParams = req.query || {};
	
	await waivers.getWaiversDetail(queryParams, (err, waivers, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: waivers, totalCount: totalCount });
	});
};