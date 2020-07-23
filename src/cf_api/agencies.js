const agencies = require('../cf_mssql/agencies');
const error_helper = require('../helpers/error_helper');

exports.getAgencies = async (req, res) => {
	let queryParams = req.query || {};
  await agencies.getAgencies(queryParams, async (err, agencies, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		if (queryParams.insuredId && agencies.length > 0) {
			agencies = await processingAgencies(agencies);
		}

		return res.status(200).json({ success: true, data: {agencies: agencies, totalCount: totalCount} });
	});
};

const processingAgencies = async (data) => {
	return data.map(item => {
		let responseObj = item;
		if (item['CoverageAbbreviation']) {
			let coverageAbbr = Array.from(new Set(item['CoverageAbbreviation'].split(',')));
			coverageAbbr = coverageAbbr.join(',', coverageAbbr);
			responseObj['CoverageAbbreviation'] = coverageAbbr;
		}
		if (item['AgentNames']) {
			let agentNames = Array.from(new Set(item['AgentNames'].split(',')));
			agentNames = agentNames.join(',', agentNames);
			responseObj['AgentNames'] = agentNames;
		}
		return responseObj;
	});		
};

exports.createAgencies = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}
	if(!params.name) {
		invalidData = true;
  }

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

  await agencies.createAgencies(params, (err, result, agencyId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { agencyId: agencyId } });
	});
};

exports.updateAgencies = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }

	if((!params.agencyId) || (!params.name)) {
		invalidData = true;
	}

	if(params.agencyId && (parseInt(params.agencyId) <= 0 || isNaN(parseInt(params.agencyId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await agencies.updateAgencies(params, (err, result, agencyId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { agencyId: agencyId } });
	});
};

exports.removeAgencies = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
  if(params.agencyId && (parseInt(params.agencyId) <= 0 || isNaN(parseInt(params.agencyId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await agencies.removeAgencies(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};