const trades_sql = require('../mssql/trades');
const error_helper = require('../helpers/error_helper');

// GET trades by HC id
exports.getTradesByHCId = async function(req, res) {
	let params = {};
	let invalidData = false;
	let hiringClientId = null;

	params = req.query;

	if(!params) { 
		invalidData = true;
	}
	else {
		hiringClientId = params.hiringClientId;
		if(!hiringClientId) invalidData = true;
		if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	trades_sql.getTradesByHCId(params, function(err, result, totalCount) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, totalCount:totalCount, tradesList: result});
	});
};

// GET trades by SC id
exports.getTradesByLoggeduserId = async function(req, res) {
	let params = {};
	let invalidData = false;
	let userId = null;

	params = req.query;

	if(!params) { 
		invalidData = true;
	}
	else {
		userId = req.currentUser.Id		
		if(!userId) invalidData = true;
		if(userId && (parseInt(userId) <= 0 || isNaN(parseInt(userId)))) invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	   return res.send(error);
	}

	params.userId = userId;

	trades_sql.getTradesByLoggeduserId(params, function(err, result, totalCount) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, totalCount:totalCount, tradesList: result});
	});
};

exports.getSavedFormFieldsValues = async function(req, res) {
	if(!req.query.savedFormId) {
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    	return res.send(error);
	}

	const data = {};
	let savedFormId = req.query.savedFormId;
	let params = { "savedFormId" : savedFormId };
	Forms.getSavedFormFieldsValues(params, function(err, result) {
		if (err) {
			let error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		if (!result) {
			let error = error_helper.getErrorData(error_helper.CODE_FORM_NOT_FOUND, error_helper.MSG_FORM_NOT_FOUND);
			return res.send(error);
		}
		data.totalCount = result.length;
		data.savedFormId = savedFormId;
		data.savedValues = transforms.formsSavedValuesRecorsetToResponse(result);
		return res.status(200).json({ success: true, data: data });
	});	

	var trades = await Trades.getTrades();
	return res.status(200).json({ success: true, data: { trades: trades } });
};


exports.AddOrUpdatedTrades = async function(req, res) {
	let invalidData = false;
	let body = req.body;

	if(!body) {
		invalidData = true;
	}
	else {
		if(!body.hiringClientId) invalidData = true;
		if(!body.tradesList) invalidData = true;
		if(body.hiringClientId && (parseInt(body.hiringClientId) <= 0 || isNaN(parseInt(body.hiringClientId)))) invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	body.logParams = {};

	let method = req.method;
	let originalUrl = req.originalUrl;
	body.logParams.userId =req.currentUser.Id;
	body.logParams.eventDescription = method + '/' + originalUrl;

	await trades_sql.AddOrUpdatedTrades(body, function(err, result, contractId) {
	  	if(err) {
	  		error = error_helper.getSqlErrorData(err);
	  		return res.send(error);
	  	}

  	return res.status(200).json({ success: true });
	});		
}
