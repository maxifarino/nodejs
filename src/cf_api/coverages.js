const error_helper = require('../helpers/error_helper');
const coverages = require('../cf_mssql/coverages');

exports.getCoverages = async (req, res) => {
	let queryParams = req.query || {};
	
	await coverages.getCoverages(queryParams, (err, coverages, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: coverages, totalCount: totalCount });
	});
};

exports.createCoverages = async (req, res) => {	
	let params = req.body;
  let invalidData = false;
	
	if(!params) {
		invalidData = true;
	}

	if(!params.coverageTypeId ||
		 !params.agencyId ||
		 !params.agentId
		) {
		invalidData = true;
	}
	
	if(params.parentCoverageId && isNaN(parseInt(params.parentCoverageId))) invalidData = true;
	if(params.coverageTypeId && (parseInt(params.coverageTypeId) <= 0 || isNaN(parseInt(params.coverageTypeId)))) invalidData = true;
	if(params.agencyId && (parseInt(params.agencyId) <= 0 || isNaN(parseInt(params.agencyId)))) invalidData = true;
	if(params.agentId && (parseInt(params.agentId) <= 0 || isNaN(parseInt(params.agentId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await coverages.createCoverages(params, (err, result, coverageId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true, data: { coverageId: coverageId } });
	});
};

exports.updateCoverages = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
	}
	
	if(!params.coverageId ||
		 !params.coverageTypeId ||
		 !params.agencyId ||
	 	 !params.agentId
	 ) {
		invalidData = true;
 	}
  
  if(params.coverageId || (parseInt(params.coverageId ) <= 0 || isNaN(parseInt(params.coverageId )))) invalidData = true;  
	if(params.parentCoverageId && isNaN(parseInt(params.parentCoverageId))) invalidData = true;
	if(params.coverageTypeId && (parseInt(params.coverageTypeId) <= 0 || isNaN(parseInt(params.coverageTypeId)))) invalidData = true;
	if(params.agencyId && (parseInt(params.agencyId) <= 0 || isNaN(parseInt(params.agencyId)))) invalidData = true;
	if(params.agentId && (parseInt(params.agentId) <= 0 || isNaN(parseInt(params.agentId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await coverages.updateCoverages(params, (err, result, coverageId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { coverageId: coverageId } });
	});
};

exports.removeCoverages = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.coverageId || (parseInt(params.coverageId) <= 0 || isNaN(parseInt(params.coverageId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await coverages.removeCoverages(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};


exports.coverageExpirations = async (req, res) => {
	let queryParams = req.query || {};

	if(!queryParams.date) queryParams.date = Date.now();

	await coverages.coverageExpirations(queryParams, (err, coverages) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: coverages });
	});
};

exports.getCoveragesTopLayers = async (req, res) => {
	let queryParams = req.query || {};
	
	await coverages.getCoveragesTopLayers(queryParams, (err, data, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: data, totalCount: totalCount });
	});
};

exports.createCoveragesTopLayers = async (req, res) => {	
	let params = req.body;
  let invalidData = false;
	
	if(!params) {
		invalidData = true;
	}

	if(!params.coverageTypeId || !params.projectInsuredId || !params.certificateId) {
		invalidData = true;
	}
	
	if(params.coverageTypeId && (parseInt(params.coverageTypeId) <= 0 || isNaN(parseInt(params.coverageTypeId)))) invalidData = true;
	if(params.projectInsuredId && (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;
	if(params.certificateId && (parseInt(params.certificateId) <= 0 || isNaN(parseInt(params.certificateId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await coverages.createCoveragesTopLayers(params, (err, result) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		return res.status(200).json({ success: true });
	});
};

exports.getCoveragesAndAttributesStatus = async (req, res) =>{
	let params = req.query;
	var invalidData = false;

  if(!params.projectInsuredId || (parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await coverages.getCoveragesAndAttributesStatus(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true, data: result });
	});
	

}