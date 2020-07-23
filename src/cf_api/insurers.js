const error_helper = require('../helpers/error_helper');
const insurers = require('../cf_mssql/insurers');

exports.getInsurers = async (req, res) => {
	let queryParams = req.query || {};
	
	await insurers.getInsurers(queryParams, async (err, data, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}		
		return res.status(200).json({ success: true, data: data, totalCount: totalCount });
	});
};

exports.createInsurers = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}

	if(!params.insurerName) {
		invalidData = true;
  }
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await insurers.createInsurers(params, (err, result, insurerId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true, data: { insurerId: insurerId } });
	});
};

exports.removeInsurers = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.insurerId || (parseInt(params.insurerId) <= 0 || isNaN(parseInt(params.insurerId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await insurers.removeInsurers(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};