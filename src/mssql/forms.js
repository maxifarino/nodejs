const sql = require('mssql');
const AWS = require('aws-sdk');
const sql_helper = require('./mssql_helper');
const query_provider = require('../providers/query_provider');
const logger = require('./log');
const { bucket, apiVersion } = require('../helpers/aws_helper');
const file = require('./../api/files');


exports.getFormFieldsLists = async function (callback) {
	try {
		const connection = await sql_helper.getConnection();

		const queryFieldsList = query_provider.generateFormFieldsListsQuery();
		const resultFieldsList = await connection.request().query(queryFieldsList);

		const queryScorecardsSourcesList = query_provider.generateScorecardsSourcesListQuery();
		const resultScorecardsSourcesList = await connection.request().query(queryScorecardsSourcesList);

		const queryCompaniesTypesList = query_provider.generateCompaniesTypesListQuery();
		const resultCompaniesTypesList = await connection.request().query(queryCompaniesTypesList);

		const queryTurnOverRatesList = query_provider.generateTurnOverRatesListQuery();
		const resultTurnOverRatesList = await connection.request().query(queryTurnOverRatesList);

		let formFieldsLists = [];

		for (i = 0; i < resultFieldsList.recordset.length; i++) {
			let list = resultFieldsList.recordset[i];
			let query = list.query;
			let result = await connection.request().query(query);
			list.possibleValues = result.recordset;
			formFieldsLists.push(list);
		}

		let data = {};
		data.formFieldsLists = formFieldsLists;
		data.scorecardsSourcesList = resultScorecardsSourcesList.recordset;
		data.companiesTypesList = resultCompaniesTypesList.recordset;
		data.turnOverRatesList = resultTurnOverRatesList.recordset;

		connection.close();

		callback(null, data);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getFormFieldList = async function (referenceId, callback) {

	try {
		const connection = await sql_helper.getConnection();

		let query = query_provider.generateFormsFieldListQuery(referenceId);
		let result = await connection.request().query(query);

		if (result.recordset.length > 0) {
			let listQuery = result.recordset[0].query;
			let listResult = await connection.request().query(listQuery);
			connection.close();
			callback(null, listResult.recordset);
		}
	}
	catch (err) {
		callback(err, null);
	}
}

exports.getFormById = async function (params, callback) {

	try {
		let resultForm = {
			forms: [],
			discreetAccounts: [],
		}
		const connection = await sql_helper.getConnection();

		const query = query_provider.generateFormsQuery(params);
		const result = await connection.request().query(query);
		resultForm.forms = result.recordset;

		const queryAccounts = query_provider.generateDiscreetAccountsQuery();
		const resultAccounts = await connection.request().query(queryAccounts);
		resultForm.discreetAccounts = resultAccounts.recordset;

		const formsIds = resultForm.forms.map(form => form.F_Id).toString();

		const queryHiddenScorecardsFields = query_provider.generateFormsHiddenScorecardsFieldsQuery(formsIds);
		const resultHiddenScorecardsFields = await connection.request().query(queryHiddenScorecardsFields);
		const [scorecardsFields, selectedScorecardHiddenFields] = resultHiddenScorecardsFields.recordsets;
		resultForm.scorecardsFields = scorecardsFields;

		resultForm.forms = resultForm.forms.map(form => {
			// Get hidden fields for this form
			const formHiddenFields = selectedScorecardHiddenFields.filter(hiddenField => {
				return hiddenField.formId === form.F_Id;
			});

			return {
				...form,
				scorecardHiddenFields: formHiddenFields.map(formHiddenField => ({
					id: formHiddenField.id,
					name: formHiddenField.name,
				})),
			};
		});

		if (resultForm.forms.length > 0) {
			callback(null, resultForm);
		} else {
			console.log("No form found");
			callback(null, null);
		}
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getSavedFormFieldsValues = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = query_provider.generateSavedFormsFieldsValuesQuery(params);
		console.log("Atempting to retrieve saved form");
		const result = await connection.request().query(query);
		connection.close();

		if (result.recordset.length > 0) {
			callback(null, result.recordset);
		} else {
			console.log("No saved form found with that id");
			callback(null, null);
		}
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.saveFormFieldsValues = async function (params, callback) {

	// Get all saved fields
	const result = await _getSavedFormsFieldsValues(params);
	if (result.error) {
		console.log(error);
		return callback(error);
	}


	// cross check existing fields with fields in request
	let savedFormsfieldValues = result.fields;
	let changedSavedFormsFieldValues = [];
	let newSavedFormsFieldValues = [];

	for (let newValue of params.savedValues) {
		if (savedFormsfieldValues[newValue.formSectionFieldId]) {
			// If field already exists and is changed in request, add to changed array
			if (savedFormsfieldValues[newValue.formSectionFieldId].value != newValue.savedValue) {
				let changedFieldValue = {
					id: savedFormsfieldValues[newValue.formSectionFieldId].id,
					value: newValue.savedValue
				};

				changedSavedFormsFieldValues.push(changedFieldValue);
			}
		}
		else {
			// If field does not exist add to new field values array
			newValue.savedFormId = params.savedFormId;
			newSavedFormsFieldValues.push(newValue);
		}
	}

	let query = '';

	// create queries to update changed field values
	if (changedSavedFormsFieldValues.length > 0) {
		query += query_provider.generateSavedFormsFieldsValuesUpdateQuery(changedSavedFormsFieldValues);
	}

	// create insert queries for new field values
	if (newSavedFormsFieldValues.length > 0) {
		query += query_provider.generateInsertSavedFormFieldValuesQuery(newSavedFormsFieldValues);
	}

	// Verify query contains statements
	if (query.indexOf('INSERT') >= 0 || query.indexOf('UPDATE') >= 0) {
		// create transaction
		sql_helper.createTransaction(query, function (err, result) {
			if (err) {
				return callback(err);
			}
			callback(null, result);

			const logParams = {
				eventDescription: params.eventDescription,
				UserId: params.userId,
				Payload: params.savedFormId
			}

			logger.addEntry(logParams, function (err, result) {
				if (err) {
					console.log("There was an error creating log for: ");
					console.log(logParams);
					console.log(err);
				} else {
					console.log("Log succesfully created");
				}
				return;
			});
		});
	}
	else {
		// If we made it here, then all field values in the request are already in DB. Return true for idempotence.
		return callback(null, true);
	}
}

exports.createForm = async function (params, callback) {
	let query = query_provider.generateFormInsertQuery(params);

	if (!params.id)
		query = sql_helper.getLastIdentityQuery(query, 'Forms');

	sql_helper.createTransaction(query, function (err, result, formId) {
		if (err) {
			return callback(err);
		}
		callback(null, result, formId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: formId
		}

		logger.addEntry(logParams, function (err, result) {
			if (err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			} else {
				console.log("Log succesfully created");
			}
			return;
		});
	});
}


exports.createFormsSections = async function (params, callback) {
	query = query_provider.generateFormsSectionsInsertQuery(params);

	if (!params.id)
		query = sql_helper.getLastIdentityQuery(query, 'FormsSections');

	sql_helper.createTransaction(query, callback);
}

exports.deleteForms = async function (params, callback) {
	query = query_provider.generateFormsDeleteQuery(params);

	sql_helper.createTransaction(query, function (err, result) {
		if (err) {
			return callback(err);
		}
		callback(null, result);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: params.id
		}

		logger.addEntry(logParams, function (err, result) {
			if (err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			} else {
				console.log("Log succesfully created");
			}
			return;
		});
	});
}

exports.deleteFormsSections = async function (params, callback) {
	query = query_provider.generateFormsSectionsDeleteQuery(params);

	//console.log(query);

	sql_helper.createTransaction(query, callback);
}

exports.createFormsSectionsFields = async function (params, callback) {
	query = query_provider.generateFormsSectionsFieldsInsertQuery(params);

	if (!params.id)
		query = sql_helper.getLastIdentityQuery(query, 'FormsSectionsFields');

	sql_helper.createTransaction(query, callback);
}

exports.deleteFormsSectionsFields = async function (params, callback) {
	query = query_provider.generateFormsSectionsFieldsDeleteQuery(params);

	sql_helper.createTransaction(query, callback);
}

exports.addSavedForm = async function (params, callback) {

	let query = query_provider.generateInsertSavedFormQuery(params);

	if (!params.id)
		query = sql_helper.getLastIdentityQuery(query, 'SavedForms');

	sql_helper.createTransaction(query, function (err, result, savedFormId) {
		if (err) {
			callback(err, null, null);
		}
		callback(null, result, savedFormId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: savedFormId
		}

		logger.addEntry(logParams, function (err, result) {
			if (err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			} else {
				console.log("Log succesfully created");
			}
			return;
		});
	});
}

exports.createSavedForm = async function (params, callback) {
	let query = query_provider.generateSavedFormInsertQuery(params);

	if (!params.id)
		query = sql_helper.getLastIdentityQuery(query, 'SavedForms');

	sql_helper.createTransaction(query, function (err, result, savedFormId) {
		if (err) {
			callback(err, null, null);
		}
		callback(null, result, savedFormId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: savedFormId
		}

		logger.addEntry(logParams, function (err, result) {
			if (err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			} else {
				console.log("Log succesfully created");
			}
			return;
		});
	});
}

exports.getSavedFormsFilters = async function (callback) {
	try {
		let data = {};
		const connection = await sql_helper.getConnection();
		let query = query_provider.generateFormCreatorsListQuery();
		let creatorsResult = await connection.request().query(query);

		query = query_provider.generateSubmissionsSubcontractorsQuery();
		let scResult = await connection.request().query(query);

		connection.close();

		data.creators = creatorsResult.recordset;
		data.subcontractors = scResult.recordset;

		callback(null, data);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getSavedForms = async function (params, callback) {
	try {
		let totalCount = 0;
		let query = "";
		let result = null;
		const connection = await sql_helper.getConnection();

		params.getTotalCount = true;
		query = query_provider.generateSavedFormsQuery(params);
		result = await connection.request().query(query);
		totalCount = result.recordset[0].totalCount;

		params.getTotalCount = false;
		query = query_provider.generateSavedFormsQuery(params);
		// console.log('FETCH FORMS '.repeat(30))
		// console.log('\n')
		// console.log('query = ', query)
		result = await connection.request().query(query);

		connection.close();

		callback(null, result.recordset, totalCount);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getSavedFormsDateOfSubmission = async function (params, callback) {
	try {
		let query = "";
		let result = null;
		const connection = await sql_helper.getConnection();
		query = query_provider.generateSavedFormsDatesQuery(params);
		result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getSavedFormsDateOfPrequal = async function (params, callback) {
	try {
		let query = "";
		let result = null;
		const connection = await sql_helper.getConnection();
		query = query_provider.generateSavedFormsDatesPrequalQuery(params);
		result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.validateSavedForm = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = query_provider.generateValidateSavedFormQuery(params);
		const result = await connection.request().query(query);
		connection.close();

		if (result.recordset.length > 0)
			callback(null, result.recordset);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.updateSavedForm = async function (params, callback) {
	let query = query_provider.generateSavedFormUpdateQuery(params);

	sql_helper.createTransaction(query, function (err, result) {
		if (err) {
			return callback(err);
		}
		callback(null, result);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: params.savedFormId
		}

		logger.addEntry(logParams, function (err, result) {
			if (err) {
				console.log("There was an error creating log for: ");
				console.log(logParams);
				console.log(err);
			} else {
				console.log("Log succesfully created");
			}
			return;
		});
	});
}

exports.getFormsSCSentTo = async function (callback) {
	let error = null;

	try {
		const connection = await sql_helper.getConnection();
		const query = query_provider.generateGetFormsSCSentToQuery();
		const result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset);
	}
	catch (err) {
		console.log(err)
		callback(err, null);
	}
}

exports.getFormsUsers = async function (callback) {
	let error = null;

	try {
		const connection = await sql_helper.getConnection();
		const query = query_provider.generateGetFormsUsersQuery();

		const result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset);
	}
	catch (err) {
		console.log(err)
		callback(err, null);
	}
}

_getSavedFormsFieldsValues = async function (params) {
	let fields = {};
	let error = null;

	try {
		const connection = await sql_helper.getConnection();
		const query = query_provider.generateSavedFormsFieldsValuesQuery(params);
		const result = await connection.request().query(query);
		connection.close();

		// console.log('+' + '-'.repeat(20))
		// console.log('result = ', JSON.stringify(result))
		// console.log('+' + '-'.repeat(20))

		if (result.recordset.length > 0) {
			fields = _convertToDictionary(result.recordset);
		}
		return { error, fields };
	}
	catch (err) {
		console.log(err);
		error = err;
		return { error, fields };
	}
}

_convertToDictionary = function (fields) {
	let dictionary = {};
	for (let field of fields) {
		dictionary[field.formSectionFieldId] = { id: field.id, value: field.value };
	}

	return dictionary;
}

exports.getFormIdByName = async function (hiringClientId, formName, callback) {

	try {
		const connection = await sql_helper.getConnection();

		const query = `select top 1 id from forms where HiringClientId = ${hiringClientId} and Name = '${formName}'`;
		console.log(query);
		const result = await connection.request().query(query);
		connection.close();

		if (result.recordset.length > 0) {
			callback(null, result.recordset[0]);
		} else {
			console.log("No form found");
			callback(null, null);
		}
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getSavedFormByDiscreetAccounts = async function (savedFormId, callback) {
	try {
		const connection = await sql_helper.getConnection();

		const query = `Select daf.DiscreteAccountsId from DiscreteAccounts_Forms daf where FormId= ${savedFormId}`;
		console.log('getSavedFormByDiscreetAccounts', query);
		const result = await connection.request().query(query);
		console.log('getSavedFormByDiscreetAccounts', result.recordset);
		connection.close();

		if (result.recordset.length > 0) {
			callback(null, result.recordset);
		} else {
			console.log("No form found");
			callback(null, null);
		}
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.saveFormByDiscreetAccounts = async function (form, callback) {
	try {
		const connection = await sql_helper.getConnection();

		let query = '';
		let formId = form.formId;

		// This flag tells which accounts should be displayed - 1: Regular accounts / 2: Discrete Accounts / 3: Both
		const accountDisplayTypeId = form.accountDisplayTypeId;

		query += `UPDATE Forms SET AccountDisplayTypeId = ${accountDisplayTypeId} WHERE Id = ${formId};`

		form.data.forEach(element => {
			if (!element.selected) {
				query += `DELETE DiscreteAccounts_Forms WHERE DiscreteAccountsId=${element.daId} AND FormId=${formId}`;
			} else {
				query += ` IF NOT EXISTS(select 1 from DiscreteAccounts_Forms WHERE DiscreteAccountsId=${element.daId} AND FormId=${formId})
					INSERT INTO DiscreteAccounts_Forms(DiscreteAccountsId,FormId) VALUES(${element.daId},${formId});
				`;
			}
		});

		await connection.request().query(query);

		connection.close();

		callback(null, {
			accountDisplayTypeId,
		});
	}	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.saveCopySubmission = async function (parameter, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let storeProcedure = `exec sp_CopySubmissionForm ${parameter.copyFromSubmissionId},${parameter.formIdIncomplete}`;

		const result = await connection.request().query(storeProcedure);

		for (let fileInformation of result.recordset) {
			let sourceFileName = file.getDocumentFileName(fileInformation.NameFile, fileInformation.SubContractorId, fileInformation.IdFile);

			var s3 = new AWS.S3({ apiVersion: apiVersion, params: { Bucket: bucket } });
			var key = file.getDocumentFileName(fileInformation.NameFile, fileInformation.SubContractorId, fileInformation.FileId);

			var params = { Bucket: bucket, CopySource: '/'+bucket+'/'+sourceFileName, Key: key };

			s3.copyObject(params, function (err, data) {
				if (err) {
					console.log(err)
				} else {
					console.log("Successfully copied data to S3 Bucket");
				}
			});
		}

		connection.close();

		callback(null, result.recordset);
	}
	catch (err) {
		console.log(err);
		callback(err, null);
	}
}

exports.saveHiddenScorecardsFields = async function (parameters, callback) {
	try {
		const { hiddenScorecardFields, formId } = parameters;
		const connection = await sql_helper.getConnection();

		let query = `DELETE FROM ScorecardsHiddenFields WHERE FormId = ${formId};`;

		for (let field of hiddenScorecardFields) {
			query += `INSERT INTO ScorecardsHiddenFields (FormId, ScorecardFieldId) VALUES (${formId}, ${field.id});`;
		}

		await connection.request().query(query);

		connection.close();

		callback(null);
	} catch (err) {
		callback(err);
	}
}
