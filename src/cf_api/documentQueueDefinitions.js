const documentQueueDefinitions = require('../cf_mssql/documentQueueDefinitions');
const error_helper = require('../helpers/error_helper');

exports.getDocumentQueueDefinitions = async (req, res) => {
	let queryParams = req.query || {};
	
	queryParams.userId = req.currentUser.Id;
	queryParams.userCFRoleId = req.currentUser.CFRole.Id;

  await documentQueueDefinitions.getDocumentQueueDefinitions(queryParams, (err, documentQueueDefinitions, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: documentQueueDefinitions, totalCount: totalCount });
	});
};

exports.createDocumentQueueDefinitions = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

  await documentQueueDefinitions.createDocumentQueueDefinitions(params, (err, result, queueId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true, queueId: queueId });
	});
};

exports.updateDocumentQueueDefinitions = async (req, res) => {
	let params = req.body;	
	let invalidData = false;
 
	if(!params) {
		invalidData = true;
  }

	if(! params.queueId || (parseInt(params.queueId) <= 0 || isNaN(parseInt(params.queueId)))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }
  
	await documentQueueDefinitions.updateDocumentQueueDefinitions(params, (err, result, queueId) => {
		if(err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
  
		return res.status(200).json({ success: true, data: { queueId: queueId } });
	});
};

exports.removeDocumentQueueDefinitions = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
  if(! params.queueId || (parseInt(params.queueId) <= 0 || isNaN(parseInt(params.queueId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await documentQueueDefinitions.removeDocumentQueueDefinitions(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};

/* Document Queue Users */
exports.getDocumentQueueUsers = async (req, res) => {
	let queryParams = req.query || {};
  await documentQueueDefinitions.getDocumentQueueUsers(queryParams, (err, documentQueueUsers, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: documentQueueUsers, totalCount: totalCount });
	});
};

exports.createDocumentQueueUsers = async (req, res) => {
  let params = req.body;
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  } 

  await documentQueueDefinitions.createDocumentQueueUsers(params, (err, result) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

  	return res.status(200).json({ success: true });
	});
};

exports.removeDocumentQueueUsers = async (req, res) => {
  let params = req.body;
	var invalidData = false;
	
	if(! params.queueId || (parseInt(params.queueId) <= 0 || isNaN(parseInt(params.queueId)))) invalidData = true;
	if(! params.userId || (parseInt(params.userId) <= 0 || isNaN(parseInt(params.userId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await documentQueueDefinitions.removeDocumentQueueUsers(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};

exports.getAvailableUsersPerRole = async (req, res) => {
	let queryParams = req.query || {};
  await documentQueueDefinitions.getAvailableUsersPerRole(queryParams, (err, users, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: users, totalCount: totalCount });
	});
};