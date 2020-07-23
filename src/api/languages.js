const hiringClients = require('../mssql/hiring_clients')
const languagesProcessor = require('../processors/languages');
const error_helper = require('../helpers/error_helper');
const transforms = require('../helpers/transforms');
const languages_mssql = require('../mssql/languages');
const _ = require('underscore')

exports.generatefiles = async function(req, res) {
	languagesProcessor.generateFiles(function(err) {
		if(err) {
			console.log(err);
			return res.send(err);
		}
		console.log("Files successfully created")
		return res.status(200).json({ success: true });
	});
}

exports.getUrls = async function(req, res) {
	const params = {};

	params.hiringClientId = req.query.hiringClientId;
	params.subContractorId = req.query.subContractorId;

	languagesProcessor.getUrls(params, function(err, result) {
		if(err) {
			return res.send(err);
		}
		if(!result) {
			let error = error_helper.getErrorData(error_helper.CODE_LANG_NOT_FOUND, error_helper.MSG_LANG_NOT_FOUND);
			return res.send(error);
		}
		return res.status(200).json({ success: true, languageUrl: result });
	});
}

exports.clone = async function(req, res) {
	if (_.isEmpty(req.body) || !req.body.languageId) {
    	var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    	return res.send(error);
  	}

	const params = {};
	params.languageId = req.body.languageId;
	params.newLanguageName = req.body.newLanguageName;

	languagesProcessor.clone(params, function (err, result) {
		if(err) {
			return res.send(err)
		}
		return res.status(200).json({ success: true });
	});
}

exports.getKeys = async function(req, res) {
	var invalidData = false;

	if(!req.query)
		invalidData = true;

	if(!req.query.languageId && !req.query.hiringClientId)
		invalidData = true;

	if (invalidData) {
    	var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    	return res.send(error);
  	}

  	const params = {}
  	params.languageId = req.query.languageId;
  	params.hiringClientId = req.query.hiringClientId;
  	const data = {}

  	languagesProcessor.getKeys(params, function(err, result) {
  		if(err) {
  			return res.send(err);
  		}
  		data.languageId = params.languageId;
  		data.totalCount = result.length;
  		data.dictionary = transforms.generateLanguageKeysResponse(result);
  		return res.status(200).json( { success: true, data: data });
  	});
}

exports.updateValues = async function(req, res) {
	var invalidData = false;

	if(!req.body)
		invalidData = true;

	if(!req.body.languageId && !req.body.hiringClientId)
		invalidData = true;

	if(req.body.dictionary.length <= 0)
		invalidData = true;

	if (invalidData) {
    	var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    	return res.send(error);
  	}

  	const params = {}
  	params.languageId = req.body.languageId;
  	params.hiringClientId = req.body.hiringClientId;
  	params.dictionary = req.body.dictionary;

  	if(!params.languageId) {
	  	// Check if there is a language already in place for the given hiringClient
		await languages_mssql.getLanguage(params, function (err, result) {
			if(err) {
				return res.send(err)
			}

			if(!result) {
				//No associated language was found for the provided HC				
			}
			else {
				params.languageId = result.L_Id;
			}			
		});

		var languageName = 'New language';

		// Get HC name for language
		await hiringClients.getHiringClientDetail(params, function(err, result) {
			if (err) {
				error = error_helper.getSqlErrorData(err);
			}
			if (!result) {
				error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
				console.log(error);
				return res.send(error);
			}

			if(result != null)
				if(result[0] != null) {
				
				if (result.length > 0) {
					let entry = {}
					languageName = result[0].Name
				}
			}
		});
		
		console.log('result:');
		console.log(params.languageId);
		console.log(languageName);
		
	  	// If not clone the default
	  	if(!params.languageId) {
	  		// Clone from default language which is 1
	  		// TODO remove this hardcode and replace 
	  		// by the default language Id
	  		params.languageId = 1;
		  	params.newLanguageName = languageName;
			await languagesProcessor.clone(params, function (err, result) {
				if(err) {
					return res.send(err)
				}
			});
	  	}
	}

  	// Continue with update
  	languagesProcessor.updateValues(params, function(err, result) {
  		if(err) {
  			return res.send(err);
  		}
  		return res.status(200).json( { success: true } );
  	});
}