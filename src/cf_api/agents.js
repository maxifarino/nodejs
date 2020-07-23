const agents = require('../cf_mssql/agents');
const error_helper = require('../helpers/error_helper');

exports.getAgents = async (req, res) => {
	let queryParams = req.query || {};
  await agents.getAgents(queryParams, (err, agents, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: {agents: agents, totalCount: totalCount} });
	});
};

exports.createAgents = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}
	if(!params.firstName || !params.lastName) {
		invalidData = true;
  }

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

  await agents.createAgents(params, (err, result, agentId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, data: { agentId: agentId } });
	});
};

exports.updateAgents = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }

	if((!params.agentId) || (!params.firstName) || (!params.lastName)) {
		invalidData = true;
	}

	if(params.agentId && (parseInt(params.agentId) <= 0 || isNaN(parseInt(params.agentId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await agents.updateAgents(params, (err, result, agentId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { agentId: agentId } });
	});
};

exports.removeAgents = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
  if(params.agentId && (parseInt(params.agentId) <= 0 || isNaN(parseInt(params.agentId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await agents.removeAgents(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};