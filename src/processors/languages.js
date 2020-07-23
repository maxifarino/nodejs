// External dependencies 
const fs = require('fs');

// Internal dependencies
// CONFIGURATIONS
const LANGUAGES_BASE_URL = process.env.LANGUAGES_BASE_URL;
const LANGUAGES_DEFAULT_LANGUAGE_ID = process.env.LANGUAGES_DEFAULT_LANGUAGE_ID;
const BACKEND_PROD_URL = process.env.BACKEND_PROD_URL;
const BACKEND_PORT = process.env.BACKEND_PORT;

// FACADES
const languagesFacade = require('../mssql/languages');

// HELPERS
const email_helper = require('../helpers/email_helper');
const error_helper = require('../helpers/error_helper');

// PROVIDERS
const query_provider = require('../providers/query_provider');


exports.generateFiles = async function(callback) {
	// Get languages RSet
	languagesFacade.getLanguagesRawData(function(err, result) {
		if(err) {
			return callback(err);
		}
		else {
			// control break to separate languages
			const languages = _separateLanguages(result);

			// process each lang and save as JSON file
			for(let lang of languages) {
				const tree = _processFlatRecord(lang.list);

				fs.writeFileSync('.' + LANGUAGES_BASE_URL + lang.id + '.json', JSON.stringify(tree));
			}

			return callback(null);
		}
	});
}

exports.getUrls = async function(params, callback) {
	const queryParams = {}
	if(params.hiringClientId || params.subContractorId) {
		queryParams.hiringClientId = params.hiringClientId;
		queryParams.subContractorId = params.subContractorId;

		languagesFacade.getLanguage(queryParams, function(err, result) {
			if(err) {
				return callback(err);
			}
			if(!result) {
				console.log('Returning default language');
				return callback(null, _generateURL(LANGUAGES_DEFAULT_LANGUAGE_ID));
			}
			let languageId = result.L_Id;
			let languageUrl = LANGUAGES_BASE_URL + languageId + '.json';

			return callback(null, _generateURL(languageId));
		});
	}
	else {
		return callback(null, _generateURL(LANGUAGES_DEFAULT_LANGUAGE_ID));
	}
}

exports.clone = async function(params, callback) {
	const query = query_provider.generateDictionariesQuery(params);

	const result = await _getDictionaries(query);
	if(result.error) {
		return callback(error);
	}

	params.dictionaries = result.dictionaries;
	params.newLanguageName = params.newLanguageName;

	languagesFacade.createLanguage(params, function(err, response) {
		if(err) {
			return callback(err);
		}
		return callback(null, 'OK');
	});
}

exports.getKeys = async function(params, callback) {
	console.log(params);
	const query = query_provider.generateLanguageKeysQuery(params);

	const result = await _getDictionaries(query);

	if(result.error) {
		return callback(error);
	}
	return callback(null, result.dictionaries);
}

exports.updateValues = async function(params, callback) {
	languagesFacade.updateValues(params, callback);
}

// Control break to separate languages
_separateLanguages = function(recordset) {
	const languages = []
	let i = 0;
	
	while(i < recordset.length) {
		const currentLanguageId = recordset[i].L_Id;
		let lang = {};
		lang.id = currentLanguageId;
		lang.list = [];

		while(i < recordset.length && recordset[i].L_Id === currentLanguageId) {
			const key = recordset[i].LK_Key;
			const value = recordset[i].D_Value;
			lang.list.push({ key: key, value: value });
			i++;
		}
		languages.push(lang);
	}
	return languages;
}

_processFlatRecord = function(list) {
	const tree = {}
	for (let reg of list){
		const key = reg.key;
		const fields = key.split('_');
		let pointer = tree;
		for (let i = 0; i < fields.length - 1; i++) {
			if (!pointer[fields[i]]) {
				pointer[fields[i]] = {};
			}
			pointer = pointer[fields[i]];
		}
		pointer[fields[fields.length-1]] = reg.value;	
	}
	return tree;
}

_generateURL = function(languageId) {
	let URL = '';
	URL += BACKEND_PROD_URL + ':' + BACKEND_PORT + LANGUAGES_BASE_URL + languageId + '.json';

	return URL;
}

_getDictionaries = async function(query) {
	let error = null;
	let dictionaries = null;

	await languagesFacade.getDictionaries(query, function(err, result) {
		if(err) {
			error = error_helper.getSqlErrorData(err);
		}
		if(!result) {
			error = error_helper.getErrorData(error_helper.CODE_LANGUAGE_NOT_FOUND, error_helper.MSG_LANGUAGE_NOT_FOUND);
		}

		dictionaries = result;
	});

	return {error, dictionaries};
}