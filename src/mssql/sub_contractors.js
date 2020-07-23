const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const query_provider = require('../providers/query_provider');
const subcontractors_query_provider = require('../providers/subcontractors_query_provider');
const hiringClientsController = require('../api/hiring_clients');
const logger = require('./log');
const { writeLog } = require('./../utils')

exports.getSubContractorsHeaderDetails = async function(params, callback) {
	try {
		const connection = await sql_helper.getConnection();
    // console.log('params'.repeat(100))

    const queryHCs = subcontractors_query_provider.generateHiringClientsBySubContractorQuery(params.subcontractorId, params.currentUserId);
    const resultHCs = await connection.request().query(queryHCs);

    // console.log('GET SUB HEADER DETAILS '.repeat(10))
    // console.log('queryHCs = ', queryHCs)
    // console.log('resultHCs.recordset = ', resultHCs.recordset)
    if (params.hiringClientId == 'null') {
      params.hiringClientId = resultHCs.recordset[0].hiringClientId
    }
    // console.log('AFTER params.hiringClientId = ', params)


		const querySCH = subcontractors_query_provider.generateSubcontractorsHeaderQuery(params);
		const resultSCH = await connection.request().query(querySCH);

		connection.close();
    // console.log('params = ', params)
    // console.log('resultSCH.recordset[0] = ', resultSCH.recordset[0])
    // console.log('resultHCs.recordset = ', resultHCs.recordset)
		callback(null, resultSCH.recordset[0], resultHCs.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null, null);
	}
}

exports.getSubContractorsForPopover = async (userId, callback) => {
  const query    = subcontractors_query_provider.generateFetchSubcontractorsForPopoverQuery(userId);
try {
		const connection = await sql_helper.getConnection();

    const results   = await connection.request().query(query);

    connection.close();

		callback(null, results.recordset);
	}
	catch(err) {
		const date = `${(new Date()).toLocaleString()}`
    console.log('\n>DATE : ' + date + ',\n>ERROR: ' + err + ', \n>PARAMS: ' + userId + ', \n>QUERY: ', query)
		callback(err, null);
	}
}

exports.getSubContractorsByKeyword = async (keyword, callback) => {
  try {
		const connection = await sql_helper.getConnection();
		const querySC    = `exec sp_subcontractorSearch '${keyword}', 'scName', 'ASC', 20, 1`;
    const resultSC   = await connection.request().query(querySC);

    connection.close();

    const results = []

    for (let i=0; i<resultSC.recordset.length; i++) {
      let sub = resultSC.recordset[i]
      results.push (
        { name: sub.SubcontractorName,
          id: sub.ID
        }
      )
    }

		callback(null, results);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getSubContractors = async function(params, callback) {

	try {
		const connection = await sql_helper.getConnection();

		if(params.pageNumber) {
			params.getTotalCount = true;
			var totalRowsCount = 0;
			var query = subcontractors_query_provider.generateSubContractorsQuery(params);
			var result = await connection.request().query(query);
			totalRowsCount = result.recordset[0].totalCount;
		}

		params.getTotalCount = false;
    const querySC = subcontractors_query_provider.generateSubContractorsQuery(params);
    // console.log('querySC = ', querySC)
    const resultSC = await connection.request().query(querySC);

    connection.close();

		callback(null, resultSC.recordset, totalRowsCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null,null);
	}
}

exports.getSubContractorsSubmissions = async function(hiringClientId, subContractorId, callback) {
	try {
		//hiringClientId = 1131
		//subContractorId = 5136

		const connection = await sql_helper.getConnection();

		const subContractorQuery = `select	subContractorId,
											(select sc.name from SubContractors sc where sc.Id = sf.SubcontractorID) subContractorName,
											sf.AnalysisCompleteDate prequalificationDate,
											sf.FormId

									from	SavedForms sf

									where	sf.HiringClientId = ${hiringClientId}
									and		sf.SubcontractorID = dbo.f_GetMergedOriginalSubcontractor(${subContractorId})
									and		sf.FinIsComplete = 1`;

		console.log(subContractorQuery);

		const getFormDataQuery = (formId, hiringClientId, subContractorId) => {
			const query = `select fsf.InternalName as FormField,
								fsv.Value as FieldValue

						from	SavedForms sf,
								FormsSections fs,
								FormsSectionsFields fsf,
								SavedFormFieldsValues fsv

						where 	sf.HiringClientId = ${hiringClientId}
						and 	sf.SubcontractorID = dbo.f_GetMergedOriginalSubcontractor(${subContractorId})
						and		sf.FormId = ${formId}
						and		sf.FinIsComplete = 1
						and		sf.FormId = fs.FormId
						and		fs.Id = fsf.FormSectionId
						and		fsv.SavedFormId = sf.Id
						and		fsv.FormSectionFieldId = fsf.Id`;

			console.log(query);

			return query
		}

		const subContractorResult = await connection.request().query(subContractorQuery);


		prequalificationsArr = []

		for(let i=0; i < subContractorResult.recordset.length; i++){

			let lookupFormId = subContractorResult.recordset[i].FormId
			let formDataQuery = getFormDataQuery(lookupFormId, hiringClientId, subContractorId)

			let formDataResult = await connection.request().query(formDataQuery)
			let formData = formDataResult.recordset

			let prequalificationObj = {}
			prequalificationObj["prequalificationDate"] = subContractorResult.recordset[i].prequalificationDate
			for(let i=0; i < formData.length; i++){
				let formField = formData[i].FormField
				let fieldValue = formData[i].FieldValue
				prequalificationObj[formField] = fieldValue;
			}

			prequalificationsArr.push(prequalificationObj)

		}

		connection.close();


		let result = {};
		result.SubcontractorId = subContractorResult.recordset[0].subContractorId;
		result.SubcontractorName = subContractorResult.recordset[0].subContractorName;
		result.prequalificationForms = prequalificationsArr

		callback(null, result);
	}
	catch(err) {
		console.log(err);
		callback(err, null,null);
	}
}

exports.getSubContractorsSummary = async function(hiringClientId, subContractorId, callback) {
	try {
		const connection = await sql_helper.getConnection();

		const query = `
			SELECT TOP 1
				sc.name, sc.address, sc.city, sc.state, sc.zipCode, sc.mainEmail,
				(SELECT Description FROM trades WHERE id = (SELECT TradeId FROM Hiringclients_SubContractors WHERE HiringClientId = ${hiringClientId} AND SubContractorId = sc.Id)) trade,
				sf.tieRating tieRatingValue,
				(SELECT name FROM TierRatings WHERE Id = sf.tieRating) tierRating,
				sf.singleProjectLimit singleProjectLimit,
				sf.aggregateProjectExposure aggregateProjectLimit,
				(SELECT name FROM CompaniesTypes WHERE id = sf.CompanyTypeId) companyType,
				(SELECT FirstName + ' ' + LastName FROM users WHERE id in (SELECT TOP 1 UserId FROM Users_SubContractors WHERE isContact = 1 AND SubContractorId = sc.id)) contactFullName,
				sf.commentary
			FROM subcontractors sc, hiringclients_subContractors hs, savedForms sf
			WHERE enabled = 1
				AND hs.hiringClientId = ${hiringClientId}
				--AND hs.subcontractorStatusId = 6
				AND hs.subcontractorId = sc.Id
				AND hs.formID = sf.formID
				AND hs.subcontractorId = sf.subcontractorId
				AND hs.hiringClientId = sf.hiringClientId
				AND sc.id = dbo.f_GetMergedOriginalSubcontractor(${subContractorId})
		`;

		const resultSC = await connection.request().query(query);

		connection.close();
		let result = {};
		if(resultSC.recordset.length > 0) {
			result = resultSC.recordset[0];
		}
		callback(null, result);
	}
	catch(err) {
		console.log(err);
		callback(err, null,null);
	}
}


exports.getSubContractorsCompleted = async function(hiringClientId, ChangedSince, completed, callback) {
	try {
		const connection = await sql_helper.getConnection();

		let query = `
			SELECT TOP 500
				sc.id, sc.name, sc.address, sc.city, sc.state, sc.zipCode, sc.mainEmail, sc.taxID,
				(SELECT TradeId FROM Hiringclients_SubContractors WHERE HiringClientId = ${hiringClientId} AND SubContractorId = sc.Id) mainTradeValue,
				(SELECT Description FROM trades WHERE id = (SELECT TradeId FROM Hiringclients_SubContractors WHERE HiringClientId = ${hiringClientId} AND SubContractorId = sc.Id)) mainTradeDescription,
				(SELECT SecondaryTradeId FROM Hiringclients_SubContractors WHERE HiringClientId = ${hiringClientId} AND SubContractorId = sc.Id) secondaryTradeValue,
				(SELECT Description FROM trades WHERE id = (SELECT SecondaryTradeId FROM Hiringclients_SubContractors WHERE HiringClientId = ${hiringClientId} AND SubContractorId = sc.Id)) secondaryTradeDescription,
				(SELECT TertiaryTradeId FROM Hiringclients_SubContractors WHERE HiringClientId = ${hiringClientId} AND SubContractorId = sc.Id) tertiaryTradeValue,
				(SELECT Description FROM trades WHERE id = (SELECT TertiaryTradeId FROM Hiringclients_SubContractors WHERE HiringClientId = ${hiringClientId} AND SubContractorId = sc.Id)) terciaryTradeDescription,
				IsNull(hs.HiringClientRequestorName, '') requestorName,
				IsNull(hs.HiringClientRequestorEmail, '') requestorEmail,
				sf.tieRating tieRatingValue,
				(SELECT name FROM TierRatings WHERE Id = sf.tieRating) tierDesc,
				hs.sourceSystemId,
				(SELECT ss.status FROM SubcontractorsStatus ss WHERE id = hs.SubcontractorStatusID) subcontractorStatus
			FROM subcontractors sc, hiringclients_subContractors hs, savedForms sf
			WHERE enabled = 1
				AND hs.hiringClientId = ${hiringClientId}
		`;

		if(completed) {
			query += ` AND hs.subcontractorStatusId = 6 `;
		}

		query += ` AND hs.subcontractorId = sc.Id
			AND hs.formID = sf.formID
			AND hs.subcontractorId = sf.subcontractorId
			AND hs.hiringClientId = sf.hiringClientId
		`;

		if(ChangedSince != null) {
			query += `AND hs.subcontractorId IN (SELECT subcontractorID FROM SavedForms WHERE hiringClientID = ${hiringClientId}
				      AND SubcontractorID = sc.id AND isNull(sf.DateOfPrequal, sf.TimeStamp) >= CONVERT(date, '${ChangedSince}'))`;
		}

		const resultSC = await connection.request().query(query);

		connection.close();

		callback(null, resultSC.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null,null);
	}
}

exports.getSubContractorTieRates = async function(callback) {

	try {
		const connection = await sql_helper.getConnection();
		const query = subcontractors_query_provider.generateSubContractorTieRatesQuery();
		const result = await connection.request().query(query);
		connection.close();

		if(result.recordset.length > 0){
			callback(null, result.recordset);
		} else {
			callback(null, null);
		}
	}
	catch(err) {
		callback(err, null);
	}
}

exports.getSubcontractorsStatus = async function(callback) {

	try {
		const connection = await sql_helper.getConnection();
		const query = `SELECT Id,Status,Description FROM SubcontractorsStatus ORDER BY Id ASC`;
		const result = await connection.request().query(query);
		connection.close();

		if(result.recordset.length > 0){
			callback(null, result.recordset);
		} else {
			callback(null, null);
		}
	}
	catch(err) {
		callback(err, null);
	}
}

exports.getSubcontractorsStatusWithCounts = async function(hcId, callback) {

	try {
		const connection = await sql_helper.getConnection();
		const query = `EXEC get_SubcontractorStatusWithCountsForHiringClient ${hcId}`;
		const result = await connection.request().query(query);
		connection.close();

		if(result.recordset.length > 0){
			callback(null, result.recordset);
		} else {
			callback(null, null);
		}
	}
	catch(err) {
		callback(err, null);
	}
}

exports.getHiringClientsBySubContractor = async function(subContractorId, currentUserId, callback) {

	try {
		const connection = await sql_helper.getConnection();
		const query = subcontractors_query_provider.generateHiringClientsBySubContractorQuery(subContractorId, currentUserId);
		const result = await connection.request().query(query);
    connection.close();

    // console.log('subContractorId = ', subContractorId)
    // console.log('query = ', query)
    // console.log('result = ', result)

		if(result.recordset.length > 0){
			callback(null, result.recordset);
		} else {
			console.log("No subContractor found.");
			callback(null, null);
		}
	}
	catch(err) {
		callback(err, null);
	}
}

exports.getSubContractorContactInfo = async function(subContractorId, callback) {

	try {
		const connection = await sql_helper.getConnection();
		const query = subcontractors_query_provider.generateSubContractorsContactQuery(subContractorId);
		const result = await connection.request().query(query);
		connection.close();

		if(result.recordset.length > 0){
			callback(null, result.recordset);
		} else {
			console.log("No subContractor found.");
			callback(null, null);
		}
	}
	catch(err) {
		console.log("Error: ");
		console.log(err);
		callback(err, null);
	}
}

exports.addSubContractor = async function(params, callback) {
	// TODO: if this EP is needed, move the TradesIds to the Hiringclients_Subcontractors table
	var query = 'DECLARE @UserID numeric(38,0)'

	query += ` INSERT INTO Subcontractors
	  (Name,
	  TradeId,
	  SecondaryTradeId,
	  TertiaryTradeId,
	  QuaternaryTradeId,
	  QuinaryTradeId,
	  Address,
	  City,
	  State,
	  ZipCode,
	  MainEmail,
	  TaxId)
	VALUES (
		'${params.name}',
		'${params.tradeId}',
		'${params.secondaryTradeId}',
		'${params.tertiaryTradeId}',
		'${params.quaternaryTradeId}',
		'${params.quinaryTradeId}',
		'${params.address}',
		'${params.city}',
		'${params.state}',
		'${params.zipCode}',
		'${params.mainEmail}',
		'${params.taxId}'
	)`;

	query = sql_helper.getLastIdentityQuery(query,'SubContractors');

	sql_helper.createTransaction(query, function(err, result, subContractorId) {
		if(err) {
			console.log(err);
			return callback(err);
		}
		callback(null, result, subContractorId);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: subContractorId
		}

		logger.addEntry(logParams, function (err, result) {
			if(err) {
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

exports.loadSubcontractorsKeyValues = async function(hiringclientId, callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query =  `SELECT LOWER(Name) n, LOWER(MainEmail) m
						FROM SubContractors WHERE Id in
						(SELECT SubcontractorId From Hiringclients_SubContractors WHERE HiringclientId = ${hiringclientId})`;

		const result = await connection.request().query(query);
		connection.close();

		if(result.recordset){
			callback(null, result.recordset);
		} else {
			callback(null, null);
		}
	}
	catch(err) {
		callback(err, null);
	}
}

exports.loadAllSubcontractorsTaxIds = async function(callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query =  `SELECT REPLACE(REPLACE(TaxId, '-', ''), ' ', '') t FROM SubContractors`;

		const result = await connection.request().query(query);
		connection.close();

		if(result.recordset){
			callback(null, result.recordset);
		} else {
			callback(null, null);
		}
	}
	catch(err) {
		callback(err, null);
	}
}

exports.checkPhoneExists = async function(params, callback) {

}

exports.updateUserRelation = async function(params, callback) {
	let queryParams = params.relations;
	let query = subcontractors_query_provider.generateSubContractorsUserRelationsUpdateQuery(queryParams);

	sql_helper.createTransaction(query, function(err, result) {
		if(err) {
			return callback(err);
		}
		callback(null, result);

		const logParams = {
			eventDescription: params.eventDescription,
			UserId: params.userId,
			Payload: params.relations.userId
		}

		logger.addEntry(logParams, function (err, result) {
			if(err) {
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

exports.saveAllSubcontractorsTaxIds = async function(hiringClientId, subContractors, callback) {

	let subcontractorsIds = [];
	for(let i = 0; i < subContractors.length; ++i) {
    let   query = subcontractors_query_provider.generateSubContractorsInsertQuery(subContractors[i]);
	const sourceSystemId = subContractors[i].sourceSystemId

    const formId         = subContractors[i].formId         ? subContractors[i].formId         : ''
    // const ShortName      = subContractors[i].ShortName      ? subContractors[i].ShortName      : ''
    const requestorName  = subContractors[i].requestorName  ? subContractors[i].requestorName  : ''
	const requestorEmail = subContractors[i].requestorEmail ? subContractors[i].requestorEmail : ''

		query = sql_helper.getLastIdentityQuery(query,'Subcontractors');

		await sql_helper.createTransaction(query, function(err, result, subContractorId) {
			if(err) {
				console.log(err);
				return callback(err, null);
			}

			subcontractorsIds.push(subContractorId);

			//Save with invite pending status
			query = subcontractors_query_provider.generateHC_SCInitialEntry(hiringClientId, subContractorId, 2, sourceSystemId, formId, requestorName, requestorEmail);
			sql_helper.createTransaction(query, function(err, result) {
				if(err) {
					console.log(err);
					return callback(err, null);
				}

				if(i == subContractors.length - 1) {
					return callback(err, subcontractorsIds);
				}
			});
		});
	}
}

exports.updateHC_SC_StatusByTaxId = async function(hiringClientId, subContractorTaxId, subcontractorStatusID, callback) {

	var query = subcontractors_query_provider.updateHC_SC_StatusByTaxId(hiringClientId, subContractorTaxId, subcontractorStatusID);

	await sql_helper.createTransaction(query, function(err, result, subContractorId) {
		if(err) {
			console.log(err);
			return callback(err, null);
		}
	});
}

exports.updateHC_SC_StatusById = async function(hiringClientId, subContractorId, subcontractorStatusID, callback) {

	var query = subcontractors_query_provider.updateHC_SC_StatusById(hiringClientId, subContractorId, subcontractorStatusID);

	await sql_helper.createTransaction(query, function(err, result, subContractorId) {
		if(err) {
			console.log(err);
			return callback(err, null);
		}
	});
}

exports.getSubContractorBrief = async function(hiringClientId, callback) {

	try {
		const connection = await sql_helper.getConnection();
		let querySC = subcontractors_query_provider.generateSubContractorsBriefQuery(hiringClientId);
		let resultSC = await connection.request().query(querySC);
		connection.close();

		callback(null, resultSC.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getSubContractorInviteValues = async function(encodedParams, callback) {
	try {
		let hiringClientId = encodedParams.hiringClientId;
		let subcontractorId = encodedParams.subcontractorId;

		const connection = await sql_helper.getConnection();
		let querySC = subcontractors_query_provider.generateSubContractorBriefQuery(subcontractorId);
		let resultSC = await connection.request().query(querySC);

		let linkAlreadyVisited = false;
		if(resultSC.recordset != null) {
			if(resultSC.recordset.length > 0) {
				if(resultSC.recordset[0].linkVisitedDate != null) {
					linkAlreadyVisited = true;
				}
			}
		}

		let queryCheckUserByEmail = null;
		let resultCheckUserByEmail = null;

		let queryTR = null;
		let resultTR = null;

		let queryTT = null;
		let resultTT = null;

		let queryCountries = null;
		let resultCountries = null;

		let queryAllStates = null;
		let resultAllStates = null;

		if(!linkAlreadyVisited) {
			queryCheckUserByEmail = subcontractors_query_provider.generateCheckUserByEmailQuery(subcontractorId);
			resultCheckUserByEmail = await connection.request().query(queryCheckUserByEmail);

			queryTR = query_provider.generateTradesQuery(hiringClientId);
			resultTR = await connection.request().query(queryTR);

			queryTT = query_provider.generateTitlesQuery();
			resultTT = await connection.request().query(queryTT);

			queryCountries = query_provider.generateCountriesQuery();
			resultCountries = await connection.request().query(queryCountries);

			queryAllStates = query_provider.generateAllCountriesStatesQuery();
			resultAllStates = await connection.request().query(queryAllStates);
		}

		connection.close();

		let data = {};

		if(!linkAlreadyVisited) {
			// Add user exists flag
			data.userExists = resultCheckUserByEmail.recordset[0].userExists;

			// Add sc data
			if(resultSC.recordset.length > 0) {
				data.subContractor = resultSC.recordset[0];
			}

			// Add hc data
			data.hiringClientId = hiringClientId;

			// Add timezones
			// if(resultTZ.recordset.length > 0) {
			//	 data.timeZones = resultTZ.recordset;
			// }

			// Add trades
			if(resultTR.recordset.length > 0) {
				data.trades = resultTR.recordset;
			}

			// Add titles
			if(resultTT.recordset.length > 0) {
				data.titles = resultTT.recordset;
			}

			data.countries = resultCountries.recordset.map(country => {
				switch (country.id) {
					// USA
					case 1:
						return {
							...country,
							states: resultAllStates.recordsets[0]
						};
					// Canada
					case 34:
						return {
							...country,
							states: resultAllStates.recordsets[1]
						};

					default:
						return country;
				}
			});

			// Add a valid token to call register save EP
			data.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJZCI6MywiRmlyc3ROYW1lIjoiTHVpcyIsIkxhc3ROYW1lIjoiVGVzdGVyMiIsIk1haWwiOiJsdWlzLnBhcmFkZWxhQGFjY2Vsb25lLmNvbSIsIlJvbGVJRCI6MSwiSXNFbmFibGVkIjoxLCJJc0NvbnRhY3QiOjEsIlRpdGxlSWQiOjAsIlBob25lIjoiNDY0NjQ2NDY0NjQ2IiwiQ2VsbFBob25lIjpudWxsLCJUaW1lWm9uZUlkIjo5LCJNdXN0UmVuZXdQYXNzIjowLCJNdXN0VXBkYXRlUHJvZmlsZSI6MCwiVGltZVN0YW1wIjoiMjAxNy0xMS0xM1QxNDoyNToyMS40NjBaIiwiUm9sZSI6eyJJZCI6MSwiTmFtZSI6IlBRIEFkbWluIiwiVGltZVN0YW1wIjoiMjAxNy0xMS0xM1QxNDoyMzo1MS4yNTdaIn0sIlRpbWVab25lIjp7IklkIjo5LCJWYWx1ZSI6IlBhY2lmaWMgRGF5bGlnaHQgVGltZSIsIkRlc2NyaXB0aW9uIjoiKFVUQy0wODowMCkgUGFjaWZpYyBUaW1lIChVUyAmIENhbmFkYSkiLCJUaW1lU3RhbXAiOiIyMDE3LTExLTMwVDE1OjQ5OjUxLjA2MFoifSwiVGl0bGUiOnsiSWQiOjAsIlRpdGxlIjoiTm9uZSIsIlRpbWVTdGFtcCI6IjIwMTctMTEtMjlUMTE6NTU6MzMuNDQ3WiJ9LCJpYXQiOjE1MjMwMTkzODYsImV4cCI6MTUzMzAxOTM4NX0.Aee4zvkZTvsAZPajnLTQFGpdnZ7fddPp6u3tZwF9Ayk';

			// Add HC logo
			await hiringClientsController.getLogo(hiringClientId, function(err, resultLogo) {
				if(err) {
					console.log(err);
					data.logo = '';
				}
				else {
					data.logo = resultLogo;
				}

				data.linkAlreadyVisited = linkAlreadyVisited;
				callback(null, data);
			});
		}	else {
			data.linkAlreadyVisited = linkAlreadyVisited;
			callback(null, data);
		}

	}	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.updateBasicSCData = async function(params, logParams, callback) {
	try {

		let queryUpdateManualSCTierRating = subcontractors_query_provider.generateUpdateSCBasicParamsQuery(params);

		sql_helper.createTransaction(queryUpdateManualSCTierRating, function(err) {
			if(err) {
				console.log(err);
				callback(err);
			}

			const finalLogParams = {
				eventDescription: logParams.eventDescription,
				UserId: logParams.userId,
				Payload: params.subcontractorId
			}

			logger.addEntry(finalLogParams, function (err, result) {
				if(err) {
					console.log("There was an error creating log for: ");
					console.log(finalLogParams);
					console.log(err);
				} else {
					console.log("Log succesfully created");
				}
				return;
			});

			callback(null);
		});
	}
	catch(err) {
		callback(err);
	}
}

exports.searchSubcontractors = async function(params, callback) {

	try {
    const connection = await sql_helper.getConnection();

    const {
      pageNumber,
      searchTerm,
      orderDirection,
      orderBy,
			pageSize,
			showPrequalEnabled,
			showCertfocusEnabled,
    } = params

    let totalRowsCount = 0;

    let countQuery = `
      SELECT      COUNT(*) AS Count
      FROM        Subcontractors s
      inner join  HiringClients_Subcontractors hs on hs.SubcontractorID = s.id
	    inner join  HiringClients h on hs.HiringClientID = h.id
	    inner join  SubcontractorsStatus ss on hs.SubcontractorStatusID = ss.Id
			WHERE	      s.Name like '%${searchTerm}%'
		`;

		if (!(showPrequalEnabled && showCertfocusEnabled)) {
			if (showPrequalEnabled) {
				countQuery += ' AND s.pqEnabled IS NOT NULL';
			} else if (showCertfocusEnabled) {
				countQuery += ' AND s.cfEnabled IS NOT NULL';
			}
		}

    const countResult = await connection.request().query(countQuery);
    totalRowsCount = countResult.recordsets[0][0].Count;

    const query = `exec sp_subcontractorSearch '${searchTerm}', '${orderBy}', '${orderDirection}', ${pageSize}, ${pageNumber}, ${showPrequalEnabled}, ${showCertfocusEnabled}`;

    const result = await connection.request().query(query);

		connection.close();

		callback(null, result.recordset, totalRowsCount);
	}
	catch(err) {
		console.log("Error: ");
		console.log(err);
		callback(err, null);
	}
}

exports.updateSubcontractortName = async function(queryParams, logParams, callback) {
	try {

    const queryUpdateSCname = subcontractors_query_provider.generateUpdateSCnameQuery(queryParams);

		sql_helper.createTransaction(queryUpdateSCname, function(err) {
			if(err) {
        // console.log('????'.repeat(100))
        console.log('err in /mssql = ', err)
        // console.log('????'.repeat(100))
				callback(err);
      }

			const finalLogParams = {
				eventDescription: logParams.eventDescription,
				UserId: logParams.userId,
				Payload: queryParams.subcontractorId
			}

			logger.addEntry(finalLogParams, function (err, result) {
				if(err) {
					console.log("There was an error creating log for: ");
					console.log(finalLogParams);
					console.log(err);
				} else {
					console.log("Log succesfully created");
				}
				return;
			});

			callback(null);
    });

	}
	catch(err) {
		callback(err);
	}
}

exports.updateHCofficeLocation = async function(queryParams, logParams, callback) {
	try {

    const queryUpdateHCofficeLocation = subcontractors_query_provider.generateUpdateHCofficeLocationQuery(queryParams);

		sql_helper.createTransaction(queryUpdateHCofficeLocation, function(err) {
			if(err) {
        console.log('err in /mssql = ', err)
				callback(err);
      }

			const finalLogParams = {
				eventDescription: logParams.eventDescription,
				UserId: logParams.userId,
				Payload: queryParams.subcontractorId
			}

			logger.addEntry(finalLogParams, function (err, result) {
				if(err) {
					console.log("There was an error creating log for: ");
					console.log(finalLogParams);
					console.log(err);
				} else {
					console.log("Log succesfully created");
				}
				return;
			});

			callback(null);
    });

	}
	catch(err) {
		callback(err);
	}
}

exports.setSCTieRate = async function(queryParams, logParams, callback) {
  const query = subcontractors_query_provider.generateUpdateManualSCTierRatingAndInsertIntoSavedFormsLogTransactionQuery(queryParams);
	try {

		sql_helper.createTransaction(query, function(err) {
			if(err) {
        const date = `${(new Date()).toLocaleString()}`
        console.log('\n>DATE : ' + date + ',\n>LOCATION: certfocus_backend/nodeapp/src/mssql/sub_contractors.js line 683,\n>ERROR: ' + err + ', \n>QUERY: ', query, '\n>QUERYorigSubTable: ', queryParams)
				callback(err);
      }

			const finalLogParams = {
				eventDescription: logParams.eventDescription,
				UserId: logParams.userId,
				Payload: queryParams.subcontractorId
			}

			logger.addEntry(finalLogParams, function (err, result) {
				if(err) {
					console.log("There was an error creating log for: ");
					console.log(finalLogParams);
					console.log(err);
				} else {
					console.log("Log succesfully created");
				}
				return;
			});

			callback(null);
    });

	}
	catch(err) {
    const date = `${(new Date()).toLocaleString()}`
    console.log('\n>DATE : ' + date + ',\n>LOCATION: certfocus_backend/nodeapp/src/mssql/sub_contractors.js line 717,\n>ERROR: ' + err + ', \n>QUERY: ', query)
		callback(err);
	}
}

exports.checkMailExists = async function(mail, callback) {
	try {
		const connection = await sql_helper.getConnection();

		let queryMailExists = subcontractors_query_provider.checkMailExistsQuery(mail);
		let resultMailExists = await connection.request().query(queryMailExists);

		connection.close();

		let exists = false;
		if(resultMailExists.recordset[0].mailExists == 1) {
			exists = true;
		}

		callback(null, exists);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getSubContractorSubmissionLink = async function(hiringClientId, subcontractorId, callback) {
	try {
		const connection = await sql_helper.getConnection();

		let querySubmission = subcontractors_query_provider.getSubmissionQuery(hiringClientId, subcontractorId);
		let resultSubmission = await connection.request().query(querySubmission);

		connection.close();

		callback(null, resultSubmission);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.registerSC = async function(subcontractor, user, logParams, callback) {
	try {

    // Query that holds all queries
    let query = '';
		// Update SC query
    let querySC =  '';
    // Insert updated SC address into SubcontractorLocation table
    let querySCloc = '';
    // Create user query
		let queryUS =  '';
		// Add user - SC relation query
    let queryUS_SC = '';
    // Swap new SC Id for old SC Id in HC_SC table when TaxId is old query
    let queryHC_SC = '';
    // Swap new SC Id for old SC Id in SavedForms table when TaxId is old query
    // or
    // Create new SavedForm for SC with unique TaxId
    let querySavedForm = '';

    // Check for Unique TaxId, Same HC-SC, Unique User:

    const connection = await sql_helper.getConnection();
    // console.log('REGISTER QUERY '.repeat(100));
    const querySubExistsForThisHC = subcontractors_query_provider.generateFetchExistingSubcontractorQuery(subcontractor)
    // console.log('querySubExistsForThisHC = ', querySubExistsForThisHC);
    const resultSubExistsForThisHC = await connection.request().query(querySubExistsForThisHC);
		// console.log('resultSubExistsForThisHC',resultSubExistsForThisHC);
    let subAlreadyExistsForThisHC = false;
    if (resultSubExistsForThisHC.recordset && resultSubExistsForThisHC.recordset.length > 0 && resultSubExistsForThisHC.recordset[0].SubcontractorId != 0) {
      subAlreadyExistsForThisHC = true;
      subcontractor.subAlreadyExistsForThisHC = subAlreadyExistsForThisHC;
      console.log('subcontractor already exists for this HC, params = ', subcontractor)
      callback(null, subAlreadyExistsForThisHC);
      return
    }


		subcontractor.formId = 0;
		const querySubcontractorForm = subcontractors_query_provider.getFetchExistingSubcontractorFormQuery(subcontractor)
		// console.log('querySubcontractorForm = ', querySubcontractorForm);
		const resultSubcontractorForm = await connection.request().query(querySubcontractorForm);
		// console.log('resultSubcontractorForm',resultSubcontractorForm);
    if (resultSubcontractorForm.recordset && resultSubcontractorForm.recordset.length > 0) {
			subcontractor.formId = resultSubcontractorForm.recordset[0].FormId;
    }

    // console.log('FormId:::', formId);
    // console.log('querySubcontractorForm = ', querySubcontractorForm);

    const queryTaxIdExists = subcontractors_query_provider.generateGetSCTaxIdExistsQuery(subcontractor);
    // console.log('queryTaxIdExists = ', queryTaxIdExists);
    const resultTaxIdExists = await connection.request().query(queryTaxIdExists);

    const queryUserIdExists = subcontractors_query_provider.generateFetchExistingUserQuery(user);
    // console.log('queryUserIdExists = ', queryUserIdExists);
    const resultUserIdExists = await connection.request().query(queryUserIdExists);



		const queryDeclareUserId = ` DECLARE @userId INT; `

    // Check if the tax id exists
		let taxIdExists = false;
    let subcontractorIdExists = 0;
    let isPrimaryLocation = 0;

    // console.log('subcontractor = ',subcontractor);

		if (resultTaxIdExists.recordset) {
      if (resultTaxIdExists.recordset.length > 0) {
        if (resultTaxIdExists.recordset[0].subcontractorId != 0) {
					taxIdExists = true;
          subcontractorIdExists = resultTaxIdExists.recordset[0].subcontractorId;
          subcontractor.subcontractorIdExists = subcontractorIdExists;
          subcontractor.taxIdExists = taxIdExists

          const querySClocationExists = subcontractors_query_provider.generateGetSCLocationExistsQuery(subcontractor);
          const resultSClocationExists = await connection.request().query(querySClocationExists);
          const loc = resultSClocationExists.recordset[0]
          subcontractor.loc = loc

          if ((subcontractor.zipcode && loc.ZipCodeExists)) {
            isPrimaryLocation = 1
          } else if (!subcontractor.zipcode && loc.addressExists && loc.cityExists && loc.countryExists) {
            isPrimaryLocation = 1
          }
				}
      }
    }
    subcontractor.isPrimaryLocation = isPrimaryLocation

    // Check if User id exists
    let mailExists = false;
    subcontractor.mailExists = mailExists
    let userIdExists = 0;
    let userExistsForThisSub = false;
    // resultUserIdExists
    if (resultUserIdExists.recordset) {
      if (resultUserIdExists.recordset.length > 0) {
        if (resultUserIdExists.recordset[0].Id != 0) {
          mailExists = true;
          subcontractor.mailExists = mailExists
          userIdExists = resultUserIdExists.recordset[0].Id;
          subcontractor.userIdExists = userIdExists;
          const queryUserIdExistsForThisSub = subcontractors_query_provider.generateGetSubTaxIDByUserId(userIdExists);
          const resultUserIdExistsForThisSub = await connection.request().query(queryUserIdExistsForThisSub);

          const TaxIDResults = resultUserIdExistsForThisSub.recordset

          subcontractor.usersSubTaxIds = []
          for (let i=0; i<TaxIDResults.length; i++) {
           const usersSubTaxId = TaxIDResults[i].TaxID;

            subcontractor.usersSubTaxIds.push(usersSubTaxId)
            if (subcontractor.taxId == usersSubTaxId && usersSubTaxId != 0) {
              userExistsForThisSub = true
              subcontractor.userExistsForThisSub = userExistsForThisSub;
            }
          }
				}
      }
    }

    connection.close();


    let queryStatus = ''

    // CONDITIONS BASED ON EXISTENCE OF TAX_ID
    if (taxIdExists) { // if TaxId DOES exist
      // ROUTE # 2A
      subcontractor.route = 'route_A'
      // Swap new SC Id for old SC Id in HC_SC table when TaxId is old
      queryHC_SC = subcontractors_query_provider.generateSwapNewSCIDwithOldInHC_SCQuery(subcontractor); // l. 565

      // Update SC query -- duplicate TaxId
      querySC = subcontractors_query_provider.generateUpdateDuplicateSCQuery(subcontractor)
      // update ORIGINAL subcontractor to Pending Submission
      queryStatus = subcontractors_query_provider.updateHC_SC_StatusByTaxId(subcontractor.hiringClientId, subcontractor.taxId, 4, subcontractor.formId) // l. 196

      if (isPrimaryLocation == 0) {
        // Insert Address into SubcontractorLocation Table
        querySCloc = subcontractors_query_provider.generateInsertSubcontractorLocationQuery(subcontractor, user, isPrimaryLocation);
      }

    } else {
      // ROUTE # 2B
      subcontractor.route = 'route_B'
			// Update SC query -- unique TaxId
      querySC =  subcontractors_query_provider.generateUpdateSCQuery(subcontractor); // l. 577
      // Insert Address into SubcontractorLocation Table
      isPrimaryLocation = 1
      querySCloc = subcontractors_query_provider.generateInsertSubcontractorLocationQuery(subcontractor, user, isPrimaryLocation);
      // update NEW subcontractor to Pending Submission
      queryStatus = subcontractors_query_provider.updateHC_SC_StatusById(subcontractor.hiringClientId, subcontractor.id, 4, subcontractor.formId) // l. 196
    }
    // CONDITIONS BASED ON EXISTENCE OF USER
    if (!mailExists) {
      // ROUTE # 2XA
      subcontractor.route += ' route_C'
      // Create user query
      queryUS =  subcontractors_query_provider.generateAddUserQuery(user); // l. 626
    }
    if (!userExistsForThisSub) {
      // ROUTE # 2XB
      subcontractor.route += ' route_D'
      // Add user - SC relation query based on oldest SCID
      queryUS_SC =  subcontractors_query_provider.generateUserSCQuery(subcontractor); // l. 674
    }

    // Create new SavedForm for SC with unique TaxId -- will handle either unique or duplicate TaxId
    querySavedForm =  subcontractors_query_provider.addSavedFormsRegisterQuery(subcontractor); // l. 783
    // }

    query = queryDeclareUserId + querySC + querySCloc + queryUS + queryHC_SC + queryStatus + queryUS_SC + querySavedForm;


    // console.log('REGISTER QUERY '.repeat(50))
    // console.log('userResults = ', userResults)
    // console.log('resultUserIdExists = ', resultUserIdExists)
    // console.log('queryUserIdExists = ', queryUserIdExists)
    // console.log('subcontractor = ', subcontractor);
    // console.log(query);
    // console.log(`+------------------\n|subcontractor = ${JSON.stringify(subcontractor)}\n|queryDeclareUserId = ${queryDeclareUserId}|\nquerySC = ${querySC}|\nqueryUS = ${queryUS}|\nqueryHC_SC = ${queryHC_SC}|\nqueryStatus = ${queryStatus}|\nqueryUS_SC = ${queryUS_SC}|\nquerySavedForm = ${querySavedForm}\n+--------------------`)

    if (!taxIdExists && !subcontractor.taxId && subcontractor.countryId == 1 ) {
      throw 'No Tax ID supplied'
    }

		sql_helper.createTransaction(query, function(err) {
			if(err) {
        const date = (new Date).toLocaleString();
				console.log(`> Date = ${date}\n> Error: ${err}\n> Query: ${query}\n> subcontractor params: ${subcontractor}\n> queryUserIdExists: ${queryUserIdExists}\nresultUserIdExists: ${resultUserIdExists}`);
				return callback(err, null);
			}

			const finalLogParams = {
				eventDescription: logParams.eventDescription,
				UserId: logParams.userId,
				Payload: subcontractor.id
			}

			logger.addEntry(finalLogParams, function (err, result) {
				if(err) {
					console.log("There was an error creating log for: ");
					console.log(finalLogParams);
					console.log(err);
				} else {
					console.log("Log succesfully created");
				}
				return;
      });

      let subcontractorId = subcontractor.id;
      if (subcontractor.subcontractorIdExists) {
        subcontractorId = subcontractor.subcontractorIdExists;
      }

      const visitedQuery = ` UPDATE  SubContractors SET LinkVisitedDate = getDate() WHERE id = ${subcontractorId}; `;
      sql_helper.createTransaction(visitedQuery, function(err) {
        if (err) {
          console.log(err);
          return callback(err, null);
				}

				return callback(null, subAlreadyExistsForThisHC);
      });
		});
	}
	catch(err) {
		return callback(err, null);
	}
}

exports.fetchHCforms = async (hcId, callback) => {
  try {
    const connection = await sql_helper.getConnection();

    const query = `
            SELECT	  Id value, ShortName label
            FROM      Forms
            WHERE	    isActive = 1
            AND		    HiringClientId = ${hcId}
            ORDER BY  isDefault desc`;
    const result = await connection.request().query(query);
    const forms = result.recordsets[0]
    connection.close();
    callback(null, forms);
  }
  catch(err) {
    console.log(err);
    callback(err, null);
  }
}

exports.getSubContractorsLocations = async function(params, callback) {
	try {
		let totalCount                 = 0;
		let query                      = "";
    let result                     = null;
    const self                     = this
		const connection               = await sql_helper.getConnection();

		params.getTotalCount           = true;
		query                          = subcontractors_query_provider.generateLocationsQuery(params);
    result                         = await connection.request().query(query);
    // console.log('FETCH LOCATIONS '.repeat(10))
    // console.log('\n')
    totalCount                     = result.recordset[0].totalCount;

    // If no record in SubcontractorLocations, Add Address information from Subcontractors into SubcontractorLocations.  This will be done only once per Subcontractor
    let origSubTable               = null
    let subLocTable                = null
    let createUpdateErr            = null

    if (totalCount == 0 && !params.isFilter) {
      console.log('Getting Location from Old Table')
      const subId                   = params.subcontractorId
      const origSubTableQuery       = subcontractors_query_provider.generateSimpleLocationQuery(subId)
      const origSubTableRes         = await connection.request().query(origSubTableQuery);
      origSubTable                  = origSubTableRes.recordset[0]

      origSubTable.LocationId       = 0
      origSubTable.Primary          = 1
      origSubTable.PrimaryLocation  = 1
      origSubTable.CountryID        =    !origSubTable.CountryID
                                      && origSubTable.State
                                      ?  1
                                      :  origSubTable.CountryID
      origSubTable.Comments         = ''
      origSubTable.Active           = 1
      origSubTable.Fax              = ''

      origSubTable.userId           = params.userId
      origSubTable.eventDescription = 'POST//api/subcontractors/location'


      const canCreateLocation   =    origSubTable.SubcontractorID
                                  && origSubTable.Address
                                  && origSubTable.City
                                  && origSubTable.CountryID
                                  && origSubTable.ZipCode
                                  && (
                                         origSubTable.CountryID != 1
                                      || origSubTable.State
                                     )
                                  ?  true
                                  :  false

      console.log('canCreateLocation = ', canCreateLocation)
      if (canCreateLocation) {
        console.log('Creating Location')
        self.createOrUpdateLocation(origSubTable, (err, result, locationId) => {
          if (err) {
            createUpdateErr = err
          } else {
            totalCount      = 1
          }
        })
      } else {
        console.log(`Subcontractor with SubId = ${origSubTable.SubcontractorID} did not have enough of the necessary data to transcribe Address params from "Subcontractors" Table to "SubcontractorLocations" Table.  Please make sure that all of the necessary params (SubId, Address, City, CountryID, State if CountryID = 1, and ZipCode) are in the "Subcontractors" Table to allow for their transcription into "SubcontractorLocations", inspect here => `, JSON.stringify(origSubTable))
      }

    }

    if (!origSubTable) {
      console.log('Getting Location from New Table')
      params.getTotalCount = false;
      query                = subcontractors_query_provider.generateLocationsQuery(params);
      // console.log('query = ', query)
      subLocTable          = await connection.request().query(query);
      // console.log('subLocTable rows size = ', subLocTable.recordset.length)
    }

    connection.close();

    origSubTable           =    origSubTable
                             && origSubTable.Address
                             ?  [origSubTable]
                             :  null

    const finalRes         =    subLocTable
                             && subLocTable.recordset
                             && subLocTable.recordset[0]
                             ?  subLocTable.recordset
                             :  (   createUpdateErr
                                  ? null
                                  : (   origSubTable
                                      ? origSubTable
                                      : null )  )

    const message          = createUpdateErr ? createUpdateErr : (null)
    // console.log('message = ', message)
    // console.log('origSubTable = ', origSubTable)
    // console.log('Subcontractors GET Locations error message  = ', message)
    // console.log('finalRes = ', finalRes)
    // console.log('subLocTable = ', subLocTable)
		callback(message, finalRes, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.getSubContractorsStatesAndCountries = async (callback) => {
	try {
		let query = "";
    let result = null;
    let states = []
    let countries = []
    let provAndTerr = []
		const connection = await sql_helper.getConnection();

		query       = `SELECT * FROM States`
		result      = await connection.request().query(query);
		states      = result.recordset;

    query       = `SELECT * FROM Countries`
    result      = await connection.request().query(query);
    countries   = result.recordset

    query       = `SELECT * FROM Canadian_Provinces_And_Territories`
    result      = await connection.request().query(query);
    provAndTerr = result.recordset

		connection.close();

		callback(null, states, provAndTerr, countries);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
}

exports.createOrUpdateLocation = async(params, callback) => {

  // console.log('params = ', params)

  const query = `exec sp_insert_update_locationbyID ${params.SubcontractorID},
                                                    ${params.LocationId},
                                                    ${params.Primary},
                                                    '${params.Address}',
                                                    '${params.City}',
                                                    '${params.State}',
                                                    '${params.ZipCode}',
                                                    ${params.CountryID},
                                                    '${params.Comments}',
                                                    ${params.Active},
                                                    '${params.Phone}',
                                                    '${params.Fax}',
                                                    '${params.ContactName}',
                                                    '${params.ContactEmail}'`

  // console.log('query = ', query)

  sql_helper.createTransaction(query, function(err, result, LocationId) {
    if(err) {
      console.log('error creating subLocation')
      console.log(err);
      return callback(err);
    }

    callback(null, result, LocationId);

    const logParams = {
      eventDescription: params.eventDescription,
      UserId: params.userId,
      Payload: LocationId
    }

    logger.addEntry(logParams, function (err, result) {
      if(err) {
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

exports.deleteSubContractorLocation = async(params, callback) => {
  // console.log('DELETE params.id = ', params.id)

  const query = `DELETE from SubcontractorLocations WHERE Id = ${params.id}`

  sql_helper.createTransaction(query, function(err, result, id) {
    if(err) {
      console.log(err);
      return callback(err);
    }

    callback(null);

    const logParams = {
      eventDescription: params.eventDescription,
      UserId: params.userId,
      Payload: params.id
    }

    logger.addEntry(logParams, function (err, result) {
      if(err) {
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

