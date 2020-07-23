const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const processingQueryProvider = require('../cf_providers/processing_query_provider');

const statusQueryProvider = require('../cf_providers/status_query_provider');
const documentsQueryProvider = require('../cf_providers/documents_query_provider');
const projectInsuredComplianceQueryProvider = require('../cf_mssql/projectInsureds');
const waiversQueryProvider = require('../cf_providers/contacts_query_provider');

const utils = require('../helpers/utils');
const tasks = require('./tasks');

exports.getProcessing = async (params, callback) => {
	let totalCount = 0;
	let processingData = [];
	let insurersData = [];
	let endorsementsData = [];
	
	params.getTotalCount = false;
	console.log('PARAMS', params);
	
  try {		
		const connection = await sql_helper.getConnection();		
		let query = processingQueryProvider.generateProcessingQuery(params);
		let result = await connection.request().query(query);
		processingData = result.recordset;
		
		if (result.recordset.length > 0)
			totalCount = result.recordset.length;

		if (processingData.length > 0) {
			let query2 = processingQueryProvider.generateProcessingInsurersQuery(params);
			let result2 = await connection.request().query(query2);
			insurersData = result2.recordset;

			params.projectInsuredId = processingData[0].ProjectInsuredID;
			let query3 = processingQueryProvider.generateProcessingEndorsementsQuery(params);
			let result3 = await connection.request().query(query3);
			endorsementsData = result3.recordset;
		}
		
		console.log('generateProcessingQuery', processingData, insurersData, endorsementsData);

		connection.close();		
		callback(null, processingData, totalCount, insurersData, endorsementsData);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.getAvailableCoverages = async (params, callback) => {
	try {		
		const connection = await sql_helper.getConnection();
		let query = processingQueryProvider.generateHolderCoverageTypesQuery(params);
		let result = await connection.request().query(query);
		callback(null, result.recordset);
	}	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

// exports.createProcessing = async (params, callback) => {	
// 	let query = processingQueryProvider.generateProcessingInsertQuery(params);
// 	sql_helper.createTransaction(query, (err, result, data) => {
// 		console.log('generateProcessingInsertQuery: ', err, result, data);			
// 		return (err) 
// 			? callback(err)
// 			: callback(null, result, data);
// 	});
// };

exports.updateProcessing = async (params, callback) => {
	let query = processingQueryProvider.generateProcessingUpdateQuery(params);	
	sql_helper.createTransaction(query, (err, result, data) => {
		console.log('updateProcessing: ', err, result, data);	
		if(err) {
			return callback(err);
		} else {
			callback(null, result, data);
		}
	});
};

// exports.getDeficiencyViewer = async (params, callback) => {
// 	let totalCount = 0;
// 	let countResult = 0;
// 	let result = {};
// 	params.getTotalCount = false;

//   try {		
// 		const connection = await sql_helper.getConnection();		
// 		let query = processingQueryProvider.generateDeficiencyViewerQuery(params);
// 		result = await connection.request().query(query);
		
// 		if(result.recordset.length > 0)
// 			totalCount = result.recordset.length;

// 		connection.close();		
// 		callback(null, result.recordset, totalCount);
// 	}
// 	catch(err) {
// 		console.log(err);
// 		callback(err, null);
// 	}
// };


exports.calculateDeficiencies = async (params, callback) => {

		const connection = await sql_helper.getConnection();		
		const rulesComparisonQuery = processingQueryProvider.generateRulesComparisonQuery(params);
		const rulesComparisonRecordset = await connection.request().query(rulesComparisonQuery);
		const rulesComparisonResult = rulesComparisonRecordset.recordset;
		console.log('REQ.SET. RULES: ', rulesComparisonResult.length, rulesComparisonResult);

		const coveragesComparisonQuery = processingQueryProvider.generateCoveragesComparisonQuery(params);
		const coveragesComparisonRecordset = await connection.request().query(coveragesComparisonQuery);		
		const coveragesComparisonResult = coveragesComparisonRecordset.recordset;
		console.log('COVERAGES: ', coveragesComparisonResult.length, coveragesComparisonResult);

		const certificateId = params.certificateId;
		const projectInsuredId = coveragesComparisonResult[0].ProjectInsuredId;
		console.log('CERTIFICATE ID:',certificateId,'PROJECTINSURED ID:',projectInsuredId);

		// Clear deficiency by certificateId if it already calculated (only when Data Entry is edited)
		console.log('CLEAR DEFICIENCIES & WAIVERS ASSOCIATED');
		const deficiencyQuery = processingQueryProvider.generateDeficiencySelectQuery({ certificateId: certificateId });
		const deficiencyRecordset = await connection.request().query(deficiencyQuery);		
		const projectInsuredDefiencyIds = deficiencyRecordset.recordset.map((e) => e.ProjectInsuredDeficiencyID);
		if (projectInsuredDefiencyIds.length) {
			const waiversDeleteQuery = waiversQueryProvider.generateDeleteWaiversDeficienciesQuery({ projectInsuredDefiencyIds: projectInsuredDefiencyIds.join(',')});
			console.log('remove projectInsuredDefiencyIds:', projectInsuredDefiencyIds.join(','), waiversDeleteQuery);
			const waiversDeleteQueryRecordset = await connection.request().query(waiversDeleteQuery);		
			console.log('WAIVERS ASSOCIATED CLEARED', waiversDeleteQueryRecordset);
		}
		const deficiencyDeleteQuery = processingQueryProvider.generateDeficiencyDeleteQuery({ certificateId: certificateId });
		const deficiencyDeleteRecordset = await connection.request().query(deficiencyDeleteQuery);		
		console.log('DEFICIENCIES CLEARED', deficiencyDeleteRecordset);
		// Clear status by certificateId if it already calculated (only when Data Entry is edited)
		const statusDeleteQuery = statusQueryProvider.generateCoverages_CoveragesAttributes_StatusDeleteQuery({ certificateId: certificateId });
		const statusDeleteRecordset = await connection.request().query(statusDeleteQuery);		
		console.log('COVERAGES STATUS CLEARED', statusDeleteRecordset);

		/* BEGIN REMOVE ALL NON-SUBMITTED */
		// Remove waiver associated with deficiencies NON-SUBMITTED
		console.log('CLEAR ALL NON-SUBMITTED DEFICIENCIES & WAIVERS ASSOCIATED');
		const deficiencyQueryNONSUB = processingQueryProvider.generateDeficiencySelectQuery({ projectInsuredId, certificateId: 0 });
		const deficiencyRecordsetNONSUB = await connection.request().query(deficiencyQueryNONSUB);		
		const projectInsuredDefiencyIdsNONSUB = deficiencyRecordsetNONSUB.recordset.map((e) => e.ProjectInsuredDeficiencyID);
		if (projectInsuredDefiencyIdsNONSUB.length) {
			const waiversDeleteQueryNONSUB = waiversQueryProvider.generateDeleteWaiversDeficienciesQuery({ projectInsuredDefiencyIds: projectInsuredDefiencyIdsNONSUB.join(',')});
			console.log('remove projectInsuredDefiencyIds:', projectInsuredDefiencyIdsNONSUB.join(','), waiversDeleteQueryNONSUB);
			const waiversDeleteQueryRecordsetNONSUB = await connection.request().query(waiversDeleteQueryNONSUB);		
			console.log('WAIVERS ASSOCIATED CLEARED', waiversDeleteQueryRecordsetNONSUB);
		}
		// remove all deficiencies for NON-SUBMITTED
		const deficiencyDeleteQueryNONSUB = processingQueryProvider.generateDeficiencyDeleteQuery({ projectInsuredId, certificateId: 0 });
		console.log('deficiencyDeleteQuery', deficiencyDeleteQueryNONSUB);
		const deficiencyDeleteQueryRecordsetNONSUB = await connection.request().query(deficiencyDeleteQueryNONSUB);		
		console.log('DEFICIENCIES CLEARED', deficiencyDeleteQueryRecordsetNONSUB);
		// remove allcoverages & coverages attribute NON-SUBMITTED
		const statusDeleteQueryNONSUB = statusQueryProvider.generateCoverages_CoveragesAttributes_StatusDeleteQuery({ projectInsuredId, certificateId: 0 });
		console.log('statusDeleteQuery', statusDeleteQueryNONSUB);
		const statusDeleteQueryRecordsetNONSUB = await connection.request().query(statusDeleteQueryNONSUB);
		console.log('COVERAGES STATUS CLEARED', statusDeleteQueryRecordsetNONSUB);
		/* END REMOVE ALL NON-SUBMITTED */


		const AMBestRatingList = [
			{ label: '-- Rating --', value: '' },
			{ label: 'A++', value: 'A++' },
			{ label: 'A+', value: 'A+' },
			{ label: 'A', value: 'A' },
			{ label: 'A-', value: 'A-' },
			{ label: 'B++', value: 'B++' },
			{ label: 'B+', value: 'B+' },
			{ label: 'B', value: 'B' },
			{ label: 'B-', value: 'B-' },
			{ label: 'C++', value: 'C++' },
			{ label: 'C+', value: 'C+' },
			{ label: 'C', value: 'C' },
			{ label: 'C-', value: 'C-' },
			{ label: 'D', value: 'D' },
			{ label: 'E', value: 'E' },
			{ label: 'F', value: 'F' },
			{ label: 'S', value: 'S' }
		];

		let coveragesProcessedList = [];
		let deficienciesProcessedList = [];
		
		// SUMARIZE MULTIPLE INSURERS IN THE SAME COVERAGE
		coveragesComparisonResult.forEach((coverage, index) => {
			console.log('FOREACH', index);
			// Check coverage
			let coverageFound = coveragesProcessedList.findIndex((coveragesProcessed) => (
				coveragesProcessed.RuleGroupID === coverage.RuleGroupID && 
				coveragesProcessed.RuleID === coverage.RuleID 
			));
			const coverageProcessed = coverageFound >= 0 ? coveragesProcessedList[coverageFound] : null;
			console.log('CURRENT TO COMPARE: ', coverage);
			console.log('COVERAGE TO COMPARE: ', coverageProcessed);
			if (coverageProcessed === null) {
				coveragesProcessedList.push(coverage);
			} else {
				console.log('COVERAGE FOUND', coverage.InsurerID, coverageProcessed.InsurerID);

				let conditionValue = null;
				let coverageProcessedValue = null;
				let coverageValue = null;
				let conditionOrderValue = -1;
				let coverageProcessedOrderValue = -1;
				let coverageOrderValue = -1;
				let coverageProcessedExpirationDate = null;
				let coverageExpirationDate = null;
				let coverageProcessedExpirationDateParsed = 0;
				let coverageExpirationDateParsed = 0;

				switch (coverageProcessed.ConditionTypeID) {
					case 1:
						conditionValue = new String(coverage.ConditionValue);
						coverageProcessedValue = new String(coverageProcessed.AttributeValue);
						coverageValue = new String(coverage.AttributeValue);
						coverageProcessedExpirationDate = utils.date2str(new Date(coverageProcessed.ExpirationDate), 'yyyy-MM-dd');
						coverageProcessedExpirationDateParsed = Date.parse(coverageProcessedExpirationDate);
						coverageExpirationDate = utils.date2str(new Date(coverage.ExpirationDate), 'yyyy-MM-dd');
						coverageExpirationDateParsed = Date.parse(coverageExpirationDate);

						console.log('Comparison (1) Check/Uncheck = : required:[', conditionValue.valueOf(),'] /current: [', coverageProcessed.AttributeValue, '](', coverageProcessedExpirationDate,') /new: [', coverage.AttributeValue, '](',coverageExpirationDate ,')');
						if (conditionValue.valueOf() === coverageProcessedValue.valueOf()) {
							console.log('procesed is correct');
						}
						if (
							( // if new compliant and better expiration than processed
								conditionValue.valueOf() === coverageValue.valueOf() && coverageExpirationDateParsed > coverageProcessedExpirationDateParsed
							)
								||
							( // if new compliant and processed not
								conditionValue.valueOf() === coverageValue.valueOf() && conditionValue.valueOf() !== coverageProcessedValue.valueOf()
							)
						 )
						{
							console.log('new is better');
							coveragesProcessedList[coverageFound].AttributeValue = coverage.AttributeValue;
							coveragesProcessedList[coverageFound].CoverageID = coverage.CoverageID;
							coveragesProcessedList[coverageFound].CoverageAttributeID = coverage.CoverageAttributeID;
							coveragesProcessedList[coverageFound].EffectiveDate = coverage.EffectiveDate;
							coveragesProcessedList[coverageFound].ExpirationDate = coverage.ExpirationDate;
						}
						if (conditionValue.valueOf() !== coverageValue.valueOf() && conditionValue.valueOf() !== coverageProcessedValue.valueOf()) {
							console.log('processed & new are incorrect: processed continues');
						}
						break;
					case 2:
					case 3:
						conditionValue = new String(coverage.ConditionValue);
						coverageProcessedValue = new String(coverageProcessed.AttributeValue);
						coverageValue = new String(coverage.AttributeValue);
						conditionOrderValue = AMBestRatingList.findIndex((e) => coverage.ConditionValue == e.value );
						coverageProcessedOrderValue = AMBestRatingList.findIndex((e) => coverageProcessed.AttributeValue == e.value );
						coverageOrderValue = AMBestRatingList.findIndex((e) => coverage.AttributeValue == e.value );

						coverageProcessedExpirationDate = utils.date2str(new Date(coverageProcessed.ExpirationDate), 'yyyy-MM-dd');
						coverageProcessedExpirationDateParsed = Date.parse(coverageProcessedExpirationDate);
						coverageExpirationDate = utils.date2str(new Date(coverage.ExpirationDate), 'yyyy-MM-dd');
						coverageExpirationDateParsed = Date.parse(coverageExpirationDate);

						console.log('Comparison (2) AM Best = o >= : required:', conditionOrderValue,' /current:', coverageProcessed.AttributeValue, coverageProcessedOrderValue, '(', coverageProcessedExpirationDate,') /new: ', coverage.AttributeValue, coverageOrderValue, '(',coverageExpirationDate ,')');
						if (coverageProcessedOrderValue == 0 && coverageOrderValue > 0) {
							console.log('processed is 0 -> new is better');
							coveragesProcessedList[coverageFound].AttributeValue = coverage.AttributeValue;
							coveragesProcessedList[coverageFound].CoverageID = coverage.CoverageID;
							coveragesProcessedList[coverageFound].CoverageAttributeID = coverage.CoverageAttributeID;
							coveragesProcessedList[coverageFound].EffectiveDate = coverage.EffectiveDate;
							coveragesProcessedList[coverageFound].ExpirationDate = coverage.ExpirationDate;

						} else if (coverageProcessedOrderValue > 0 && coverageOrderValue > 0) {
							if (conditionOrderValue >= coverageProcessedOrderValue && coverageProcessedExpirationDateParsed >= coverageExpirationDateParsed) {
								console.log('processed is correct');
							} 
							if (
									(	// new is better value and same or better expiration than processed
										coverageProcessedOrderValue >= coverageOrderValue
										&& coverageExpirationDateParsed >= coverageProcessedExpirationDateParsed
									)
								||
									( // new is same or worst value but compliant and better expiration than processed
										coverageProcessedOrderValue <= coverageOrderValue
										&& conditionOrderValue >= coverageProcessedOrderValue
										&& coverageExpirationDateParsed > coverageProcessedExpirationDateParsed
									)
							 	)
							{
								console.log('new is better');
								coveragesProcessedList[coverageFound].AttributeValue = coverage.AttributeValue;
								coveragesProcessedList[coverageFound].CoverageID = coverage.CoverageID;
								coveragesProcessedList[coverageFound].CoverageAttributeID = coverage.CoverageAttributeID;
								coveragesProcessedList[coverageFound].EffectiveDate = coverage.EffectiveDate;
								coveragesProcessedList[coverageFound].ExpirationDate = coverage.ExpirationDate;
							}
							if (conditionOrderValue < coverageProcessedOrderValue && conditionOrderValue < coverageOrderValue) {
								console.log('processed & new are incorrect: processed continues');
							}
						} else if (coverageProcessedOrderValue == 0 && coverageOrderValue == 0) {
							console.log('processed & new are empty');
						}
						break;
					case 4:
					case 5:
					case 6:
						conditionValue = (typeof coverage.ConditionValue !== 'undefined' && coverage.ConditionValue !== null && coverage.ConditionValue !== '') ? coverage.ConditionValue : 0;
						coverageProcessedValue = (typeof coverageProcessed.AttributeValue !== 'undefined' && coverageProcessed.AttributeValue !== null && coverageProcessed.AttributeValue !== '') ? coverageProcessed.AttributeValue : 0;
						coverageValue = (typeof coverage.AttributeValue !== 'undefined' && coverage.AttributeValue !== null && coverage.AttributeValue !== '') ? coverage.AttributeValue : 0;

						coverageProcessedExpirationDate = utils.date2str(new Date(coverageProcessed.ExpirationDate), 'yyyy-MM-dd');
						coverageProcessedExpirationDateParsed = Date.parse(coverageProcessedExpirationDate);
						coverageExpirationDate = utils.date2str(new Date(coverage.ExpirationDate), 'yyyy-MM-dd');
						coverageExpirationDateParsed = Date.parse(coverageExpirationDate);

						if (coverageProcessed.ConditionTypeID === 4) console.log('Comparison (4) = : required:', conditionValue ,'[',conditionValue,'] /current:', coverageProcessed.AttributeValue,'[',coverageProcessedValue, '](', coverageProcessedExpirationDate,') /new: [', coverage.AttributeValue,'[',coverageValue,'](',coverageExpirationDate ,')');
						if (coverageProcessed.ConditionTypeID === 5) console.log('Comparison (5) >= : required:', conditionValue ,'[',conditionValue,'] /current:', coverageProcessed.AttributeValue,'[',coverageProcessedValue, '](', coverageProcessedExpirationDate,') /new: [', coverage.AttributeValue,'[',coverageValue,'](',coverageExpirationDate ,')');
						if (coverageProcessed.ConditionTypeID === 6) console.log('Comparison (6) > : required:', conditionValue ,'[',conditionValue,'] /current:', coverageProcessed.AttributeValue,'[',coverageProcessedValue, '](', coverageProcessedExpirationDate,') /new: [', coverage.AttributeValue,'[',coverageValue,'](',coverageExpirationDate ,')');

						coveragesProcessedList[coverageFound].AttributeValue = parseFloat(coverageProcessedValue) + parseFloat(coverageValue);

						if (coverageProcessedExpirationDateParsed <= coverageExpirationDateParsed) {
							console.log('processed is correct');
						} else {
							// set expiration as the lowest expiration date in the multiple insurer coverages case
							console.log('new is better');
							coveragesProcessedList[coverageFound].CoverageID = coverage.CoverageID;
							coveragesProcessedList[coverageFound].CoverageAttributeID = coverage.CoverageAttributeID;
							coveragesProcessedList[coverageFound].EffectiveDate = coverage.EffectiveDate;
							coveragesProcessedList[coverageFound].ExpirationDate = coverage.ExpirationDate;
						}						

						console.log('processed & new are added');
						break;
					default:
						console.log('ERROR: No comparison defined!');
						return;
				}


			}
			
		});
		console.log('COVERAGES SUMMARIZED', coveragesProcessedList.length)

		let coverageHasAnyDeficiency = false;
		let coverageHasMajorDeficiency = false;
		let certificateHasMajorDeficiency = false;
		let certificateHasAnyDeficiency = false;
		let lastCoverage = null;
		let currentCoverage = null;
		let coverageStatusId = null;
		const today = utils.date2str(new Date(), 'yyyy-MM-dd');
		const todayParsed = Date.parse(today);

		// CALCULATE DEFICIENCIES		
		coveragesProcessedList.forEach((coverage) => {

			currentCoverage = coverage;
			let isMajorDeficiency = false;

			if (!lastCoverage) {
				console.log('PROCESSING FIRST COVERAGE', lastCoverage);
				lastCoverage = coverage;
			} else if (lastCoverage.RuleGroupID !== currentCoverage.RuleGroupID)  {
				console.log('PROCESSING LAST COVERAGE BEFORE CURRENT', lastCoverage.RuleGroupID, currentCoverage.RuleGroupID);
				coverageStatusId = 3;
				if (coverageHasAnyDeficiency) coverageStatusId = 4;
				if (coverageHasMajorDeficiency) coverageStatusId = 2;
				console.log('CHANGE STATUS OF COVERAGE TO', coverageStatusId);

				const coverageStatusData = {
					ruleGroupId: lastCoverage.RuleGroupID,
					coverageStatusId,
					certificateId
				};
				const statusCoveragesStatusUpdateQuery = statusQueryProvider.generateCoveragesUpdateStatusQuery(coverageStatusData);
				connection.request().query(statusCoveragesStatusUpdateQuery);			

				lastCoverage = currentCoverage;
				coverageHasAnyDeficiency = false;
				coverageHasMajorDeficiency = false;					
			}

			let conditionIsOk = false;
			let deficiencyObj = null;
			let coverageExpirationDate = null;
			let coverageExpirationDateParsed = null;
			// Check coverage
			let ruleFound = rulesComparisonResult.filter((rule) => (
				coverage.RuleGroupID === rule.RuleGroupID && 
				coverage.RuleID === rule.RuleID 
			));
			const rule = ruleFound[0];
			console.log('RULE TO COMPARE: ', rule);

			if (rule) {
				console.log(`Found ruleGroupId: ${coverage.RuleGroupID} ruleId: ${coverage.RuleID} `);
				
				// Check condition
				/* Rules ConditionTypeID:
					{ label: '-- Condition --', value: '' },
					{ label: '= (Checked or unchecked)', value: 1 },
					{ label: '= (AM Best Rating)', value: 2 },
					{ label: '>= (AM Best Rating)', value: 3 },
					{ label: '=', value: 4 },
					{ label: '>=', value: 5 },
					{ label: '>', value: 6 },
				*/
				console.log('coverage', coverage);
				let valueToCompare = null;
				switch (rule.ConditionTypeID) {
					case 1:
						coverageExpirationDate = utils.date2str(new Date(coverage.ExpirationDate), 'yyyy-MM-dd');
						coverageExpirationDateParsed = Date.parse(coverageExpirationDate);

						console.log('Comparison (1) Check/Uncheck = : ', coverage.AttributeValue, ' = ', rule.ConditionValue, '/expiration date:', coverageExpirationDate, '/today:', today);
						let coverageValue = new String(coverage.AttributeValue) ;
						let ruleValue = new String(rule.ConditionValue) ;
						conditionIsOk = (coverageValue.valueOf() === ruleValue.valueOf() && todayParsed <= coverageExpirationDateParsed) ? true : false;
						break;
					case 2:
						// console.log('Comparison (2) AM Best = : ', coverage.AttributeValue, ' = ', rule.ConditionValue);
						// conditionIsOk = !!(coverage.AttributeValue === rule.AttributeValue);
						// break;
					case 3:
						coverageExpirationDate = utils.date2str(new Date(coverage.ExpirationDate), 'yyyy-MM-dd');
						coverageExpirationDateParsed = Date.parse(coverageExpirationDate);

						let coverageIndex = AMBestRatingList.findIndex((e) => coverage.AttributeValue == e.value );
						let ruleIndex = AMBestRatingList.findIndex((e) => rule.ConditionValue == e.value );
						console.log('Comparison (3) AM Best = o >= : ', coverage.AttributeValue, coverageIndex, ' = ', rule.ConditionValue, ruleIndex, '/expiration date:', coverageExpirationDate, '/today:', today);
						conditionIsOk = (ruleIndex >= coverageIndex && coverageIndex != 0 && todayParsed <= coverageExpirationDateParsed) ? true : false;
						break;
					case 4:
						// valueToCompare = (typeof coverage.AttributeValue !== 'undefined' && coverage.AttributeValue !== null && coverage.AttributeValue !== '') ? coverage.AttributeValue : 0;
						// console.log('Comparison (4) = : [', valueToCompare, '] = [', rule.ConditionValue, ']');
						// conditionIsOk = !!(parseFloat(valueToCompare) === parseFloat(rule.ConditionValue));
						// break;
					case 5:
						coverageExpirationDate = utils.date2str(new Date(coverage.ExpirationDate), 'yyyy-MM-dd');
						coverageExpirationDateParsed = Date.parse(coverageExpirationDate);

						valueToCompare = (typeof coverage.AttributeValue !== 'undefined' && coverage.AttributeValue !== null && coverage.AttributeValue !== '') ? coverage.AttributeValue : 0;
						console.log('Comparison (5) = o >= : [', valueToCompare, '] >= [', rule.ConditionValue, ']', '/expiration date:', coverageExpirationDate, '/today:', today);
						conditionIsOk = (parseFloat(valueToCompare) >= parseFloat(rule.ConditionValue) && todayParsed <= coverageExpirationDateParsed) ? true : false;
						break;
					case 6:
						coverageExpirationDate = utils.date2str(new Date(coverage.ExpirationDate), 'yyyy-MM-dd');
						coverageExpirationDateParsed = Date.parse(coverageExpirationDate);

						valueToCompare = (typeof coverage.AttributeValue !== 'undefined' && coverage.AttributeValue !== null && coverage.AttributeValue !== '') ? coverage.AttributeValue : 0;
						console.log('Comparison (6) > : [', valueToCompare, '] > [', rule.ConditionValue, ']', '/expiration date:', coverageExpirationDate, '/today:', today);
						conditionIsOk = (parseFloat(valueToCompare) > parseFloat(rule.ConditionValue) && todayParsed <= coverageExpirationDateParsed) ? true : false;
						break;
					default:
						console.log('ERROR: No comparison defined!');
						return;
				}
				console.log('conditionIsOk: ', conditionIsOk);

				let coverageAttributeStatusId = null;

				if (!conditionIsOk) { // WE HAVE DEFICIENCIES
					coverageHasAnyDeficiency = true;
					certificateHasAnyDeficiency = true;
					
					deficiencyObj = {
						deficiencyStatusId: 0,
						deficiencyTypeId: rule.DeficiencyTypeID,
						deficiencyText: rule.DeficiencyText,
						// coverageTypeId: rule.CoverageTypeID,
						ruleGroupId: rule.RuleGroupID,
						ruleId: rule.RuleID,
						attributeId: rule.AttributeID,
						// coverageId: coverage.CoverageID,
						// coverageAttributeId: coverage.CoverageAttributeID,
						projectInsuredId,
						certificateId
					};
					deficienciesProcessedList.push(deficiencyObj);

					// console.log('DELETE DEFICIENCY NON-SUBMITTED: RG:', deficiencyObj.ruleGroupId, 'R:', deficiencyObj.ruleId);
					// let deficiencyDeleteData = { certificateId: 0, ruleGroupId: deficiencyObj.ruleGroupId, ruleId: deficiencyObj.ruleId, projectInsuredId: deficiencyObj.projectInsuredId };
					// let deficienciesDeleteQuery = processingQueryProvider.generateDeficiencyDeleteQuery(deficiencyDeleteData);
					// // console.log('deficienciesDeleteQuery', deficienciesDeleteQuery);
					// connection.request().query(deficienciesDeleteQuery);

					console.log('INSERT DEFICIENCY:', deficiencyObj);
					let deficienciesInsertQuery = processingQueryProvider.generateDeficiencyRulesInsertQuery(deficiencyObj);
					// console.log('deficienciesInsertQuery', deficienciesInsertQuery);
					connection.request().query(deficienciesInsertQuery);

					if (deficiencyObj.deficiencyTypeId === 1) {
						coverageHasMajorDeficiency = true;
						certificateHasMajorDeficiency = true;
						isMajorDeficiency = true;
					} else {
						coverageHasAnyDeficiency = true;
						certificateHasAnyDeficiency = true;
					}

					coverageAttributeStatusId = 4;
					if (isMajorDeficiency) {
						coverageAttributeStatusId = 2;
						console.log('MAJOR DEF CHANGE STATUS OF COVERAGE ATTRIBUTE TO', coverageAttributeStatusId);
					} else {
						console.log('STATUS OF COVERAGE ATTRIBUTE TO', coverageAttributeStatusId);
					}

				} else {
					console.log('NO DEFICIENCIES FOUND');
					coverageAttributeStatusId = 3;
					console.log('STATUS OF COVERAGE ATTRIBUTE TO', coverageAttributeStatusId);

					// let deficiencyDeleteData = { certificateId: 0, ruleGroupId: rule.RuleGroupID, ruleId: rule.RuleID, projectInsuredId };
					// console.log('DELETE DEFICIENCY NON-SUBMITTED:', deficiencyDeleteData);
					// let deficienciesDeleteQuery = processingQueryProvider.generateDeficiencyDeleteQuery(deficiencyDeleteData);
					// // console.log('deficienciesDeleteQuery', deficienciesDeleteQuery);
					// connection.request().query(deficienciesDeleteQuery);
				}

				// Insert status registers for Coverages & CoveragesAttributes
				const coverageStatusData = { 
					certificateId,
					projectInsuredId,
					ruleGroupId: rule.RuleGroupID,
					ruleId: rule.RuleID,
					attributeId: rule.AttributeID,
					attributeName: rule.AttributeName,
					conditionTypeId: rule.ConditionTypeID,
					conditionValue: rule.ConditionValue,
					coverageTypeId: rule.CoverageTypeID,
					coverageTypeName: rule.CoverageTypeName,
					coverageAttributeValue: coverage.AttributeValue,
					coverageStatusId: null,
					coverageAttributeStatusId, 
					coverageId: coverage.CoverageID,
					coverageAttributeId: coverage.CoverageAttributeID,
					effectiveDate: utils.date2str(new Date(coverage.EffectiveDate), 'yyyy-MM-dd'),
					expirationDate: utils.date2str(new Date(coverage.ExpirationDate), 'yyyy-MM-dd'),
				};
				console.log('INSERT COVERAGES STATUS', coverageStatusData.coverageId, coverageStatusData.coverageAttributeId, coverageStatusData.effectiveDate);
				const statusUpdateQuery = statusQueryProvider.generateCoverages_CoveragesAttributes_StatusInsertQuery(coverageStatusData);
				// console.log('statusUpdateQuery', statusUpdateQuery);
				connection.request().query(statusUpdateQuery);							


			} else {
				console.log('IF YOU SEE THIS MESSAGES THERE IS A COVERAGE & ATTRIBUTE BUT NOT A REQSET RULEGROUP & RULE');
			}

		});

		console.log('PROCESSING FINAL COVERAGE', coverageHasAnyDeficiency, coverageHasMajorDeficiency);
		coverageStatusId = 3;
		if (coverageHasAnyDeficiency) coverageStatusId = 4;
		if (coverageHasMajorDeficiency) coverageStatusId = 2;
		console.log('CHANGE STATUS OF COVERAGE TO', coverageStatusId);

		const coverageStatusData = {
			ruleGroupId: lastCoverage.RuleGroupID,
			coverageStatusId,
			certificateId
		};
		const statusCoveragesStatusUpdateQuery = statusQueryProvider.generateCoveragesUpdateStatusQuery(coverageStatusData);
		await connection.request().query(statusCoveragesStatusUpdateQuery);			


		let documentStatusId = 11;  // Processing complete
		if (certificateHasMajorDeficiency) {
			console.log('ALMOST ONE DEF IS MAJOR');
			documentStatusId = 14;  // Pending review
			console.log('-> DOCUMENT STATUS FOR MAJOR DEF', documentStatusId);
			console.log('-> ADD A TASK', params);
			tasks.createDataEntryTask(params);
		}
		const documentId = params.documentId;
		const documentsQueryProviderUpdateQuery = documentsQueryProvider.generateDocumentsUpdateQuery({ documentStatusId, documentId });
		await connection.request().query(documentsQueryProviderUpdateQuery);			
		console.log('-> CHANGE DOCUMENT STATUS TO', documentStatusId);


		console.log('CERTIFICATE WITH/WITHOUT DEFICIENCIES FOR projectInsuredId:', projectInsuredId);
		changeProjectInsuredComplianceStatus({ projectInsuredId }, (error, result) => {

			if (error) console.log('COMPLIANCE STATUS: ERROR');

			callback(null);

		});

	// }
	// catch(err) {
	// 	console.log(err);
	// 	callback(err, null);
	// }
}

const changeProjectInsuredComplianceStatus = async (params, callback) => {
	const projectInsuredId = params.projectInsuredId;

	const connection = await sql_helper.getConnection();		
	const projectInsuredStatusQuery = statusQueryProvider.generateCoverages_CoveragesAttributes_ProjectInsuredStatusComplianceQuery(params);
	const projectInsuredStatusRecordset = await connection.request().query(projectInsuredStatusQuery);				
	const projectInsuredStatusResult = projectInsuredStatusRecordset.recordset;
	console.log('STATUS RECORDS: ', projectInsuredStatusResult.length);

	let complianceStatusId = null;
	let projectInsuredHasMinorDeficiency = false
	let projectInsuredHasMajorDeficiency = false
	let projectInsuredHasNonSubmitted = false

	const anyDeficiencyCoverageStatusId = 4;
	const hasMajorDeficiencyCoverageStatusId = 2;
	const hasNonSubmittedCoverageStatusId = 1;

	let projectInsuredMinorDeficiency = projectInsuredStatusResult.filter((coverage) => (
		coverage.CoverageStatusID === anyDeficiencyCoverageStatusId
	));
	if (projectInsuredMinorDeficiency.length) projectInsuredHasMinorDeficiency = true;
	let projectInsuredMajorDeficiency = projectInsuredStatusResult.filter((coverage) => (
		coverage.CoverageStatusID === hasMajorDeficiencyCoverageStatusId
	));
	if (projectInsuredMajorDeficiency.length) projectInsuredHasMajorDeficiency = true;
	let projectInsuredHasNonSubmittedDeficiency = projectInsuredStatusResult.filter((coverage) => (
		coverage.CoverageStatusID === hasNonSubmittedCoverageStatusId
	));
	if (projectInsuredHasNonSubmittedDeficiency.length) projectInsuredHasNonSubmitted = true;

	console.log('STATUS DETECTED: projectInsuredHasMinorDeficiency', projectInsuredHasMinorDeficiency, '/projectInsuredHasMajorDeficiency', projectInsuredHasMajorDeficiency, '/projectInsuredHasNonSubmittedDeficiency', projectInsuredHasNonSubmitted);
	complianceStatusId = 6;
	if (projectInsuredHasMinorDeficiency) complianceStatusId = 15;
	if (projectInsuredHasMajorDeficiency) complianceStatusId = 6;
	if (!projectInsuredHasNonSubmitted && !projectInsuredHasMajorDeficiency && !projectInsuredHasMinorDeficiency) complianceStatusId = 1;

	console.log('CHANGE STATUS OF PROJECTINSURED TO:', complianceStatusId);

	// add deficiencies for NON-SUBMITTED
	let = deficienciesNonSubmitedInsertQuery = '';
	let = statusInserCoveragesNonSubmittedQuery = '';
	const statusNonSubmitted = 1;
	for (let i = 0, len = projectInsuredHasNonSubmittedDeficiency.length; i < len; i++) {
		let def = projectInsuredHasNonSubmittedDeficiency[i];
		const deficiencyNonSubmittedObj = {
			deficiencyStatusId: 0,
			deficiencyTypeId: def.DeficiencyTypeID,
			deficiencyText: def.DeficiencyText,
			ruleGroupId: def.RuleGroupID,
			ruleId: def.RuleID,
			projectInsuredId,
			certificateId: 0
		};
		console.log('INSERT DEFICIENCY FOR NON-SUBMITTED:', deficiencyNonSubmittedObj);
		deficienciesNonSubmitedInsertQuery += processingQueryProvider.generateDeficiencyRulesInsertQuery(deficiencyNonSubmittedObj);

		// Insert status registers for Coverages & CoveragesAttributes
		const coverageStatusData = { 
			certificateId: 0,
			projectInsuredId,
			ruleGroupId: def.RuleGroupID,
			ruleId: def.RuleID,
			attributeId: def.RuleAttributeId,
			attributeName: def.AttributeName,
			conditionTypeId: def.ConditionTypeID,
			conditionValue: def.ConditionValue,
			coverageTypeId: def.CoverageTypeId,
			coverageTypeName: def.CoverageType,
			coverageAttributeValue: '',
			coverageStatusId: statusNonSubmitted,
			coverageAttributeStatusId: statusNonSubmitted, 
			coverageId: 0,
			coverageAttributeId: 0,
			effectiveDate: '',
			expirationDate: '',
		};
		console.log('INSERT COVERAGES STATUS FOR NON-SUBMITTED', coverageStatusData);
		statusInserCoveragesNonSubmittedQuery += statusQueryProvider.generateCoverages_CoveragesAttributes_StatusInsertQuery(coverageStatusData);
		// console.log('statusUpdateQuery', statusUpdateQuery);

	};
	if (projectInsuredHasNonSubmittedDeficiency.length) {
		console.log('PROCESS DEFICIENCIES & COVERAGES STATUS INSERTS');
		console.log('deficienciesNonSubmitedInsertQuery', deficienciesNonSubmitedInsertQuery);
		console.log('statusInserCoveragesNonSubmittedQuery', statusInserCoveragesNonSubmittedQuery);
		await connection.request().query(deficienciesNonSubmitedInsertQuery);
		await connection.request().query(statusInserCoveragesNonSubmittedQuery);							
	}
	


	projectInsuredComplianceQueryProvider.getProjectInsuredsSimple({ projectInsuredId }, (error, result) => {
		console.log('COMPLIANCE STATUS BEFORE UPDATED', error, result);

		let projectInsuredData = {
			projectInsuredId,
		}
		console.log('CURRENT COMPLIANCE STATUS', result.ComplianceStatusID);
		if (result.ComplianceStatusID == 16) { // Prijectinsured is ON-HOLD, save calculated status temporaly in LastComplianceStatusID
			projectInsuredData.lastComplianceStatusId = complianceStatusId;
			console.log('SAVE CURRENT COMPLIANCE STATUS IN LastComplianceStatusID');
		} else {
			projectInsuredData.complianceStatusId = complianceStatusId;
		}

		projectInsuredComplianceQueryProvider.updateComplianceStatusProjectInsureds(projectInsuredData, (error, result) => {
			console.log('COMPLIANCE STATUS UPDATED', error, result);
			callback(error, result);
		});

	});

};

exports.changeProjectInsuredComplianceStatus = changeProjectInsuredComplianceStatus;

/* COI */
exports.getCertificateOfInsurance = async (params, callback) => {
	params.getTotalCount = false;	
  try {		
		const connection = await sql_helper.getConnection();		
		let query = processingQueryProvider.generateCertificateOfInsuranceQuery(params);
		let result = await connection.request().query(query);
		
		if (result.recordset.length > 0)
			totalCount = result.recordset.length;

		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createCertificateOfInsurance = async (params, callback) => {	
	let query = processingQueryProvider.generateCertificateOfInsuranceInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'CertificateOfInsurance');
	sql_helper.createTransaction(query, (err, result, certificateId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, certificateId);
	});
};

exports.updateCertificateOfInsurance = async (params, callback) => {
	let query = processingQueryProvider.generateCertificateOfInsuranceUpdateQuery(params);
	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.certificateId);
	});
};



/*

		// **
		// ** Deficiencies Special Rules
		// **

		// An example, Any Auto must be checked OR (All Owned Autos must be checked 
		// AND Hired must be checked AND Non-owned must be checked)

		// Reqset: (for rules with condicion type "checked")
		// any auto
		// OR
		// (
		// 	owned auto
		// 	AND 
		// 	hired auto
		// 	AND
		// 	non-owned auto
		// )
		
		let deficiencySpecialRules = [
			{
				description : 'Any auto OR comparison with hired, owned and non-owned',
				coverageTypeId: 16,
				leftDeficiencyText: 'but Owned auto, Hired auto & Non-owned auto are included',
				leftAtrribute: { 
					id: 33, name: 'Any auto'
				},
				operation: 'OR',
				rightDeficiencyText: 'but Any auto is included',
				rightAtrribute: [
					{ id: 34, name: 'Owned auto', deficiencyText: 'but Any auto is included'},
					{ id: 36, name: 'Hired auto', deficiencyText: 'but Any auto is included'},
					{ id: 37, name: 'Non-owned auto', deficiencyText: 'but Any auto is included'},
				]
			}
		];


		console.log('>>>> CONTROL: RULES && SPECIAL RULES');
		// Insert deficiencies from evaluated rules
		rulesConditionProcessedList.forEach((rule) => {
			console.log('RULE', rule);

			// Check special rules
			let specialRuleLeftAttributeExists = deficiencySpecialRules.filter((specialLeftRule) => (
				specialLeftRule.coverageTypeId === rule.deficiencyObj.coverageTypeId && 
				specialLeftRule.leftAtrribute.id === rule.deficiencyObj.attributeId
			));
			// console.log('specialRuleLeftAttributeExists: ', JSON.stringify(specialRuleLeftAttributeExists, null, 2));
			let specialRuleRightAttributeCoverageExist = deficiencySpecialRules.filter((specialRightRule) => (
				specialRightRule.coverageTypeId === rule.deficiencyObj.coverageTypeId
			));
			// console.log('specialRuleRightAttributeCoverageExist: ', JSON.stringify(specialRuleRightAttributeCoverageExist, null, 2));
			let specialRuleRightAttributeExists = [];
			if (specialRuleRightAttributeCoverageExist.length) {
				specialRuleRightAttributeExists = specialRuleRightAttributeCoverageExist[0].rightAtrribute.filter((specialRightRule) => (
					specialRightRule.id === rule.deficiencyObj.attributeId 
				)); 
			}
			// console.log('specialRuleRightAttributeExists: ', JSON.stringify(specialRuleRightAttributeExists, null, 2));
	
			if (specialRuleLeftAttributeExists.length) {
				console.log('THIS RULE IS IN A SPECIAL RULE IN THE LEFT');
				if (!rule.conditionIsOk) {
					console.log('THIS RULE IS NOT OK');
					let specialRuleRight = [];
					specialRuleLeftAttributeExists[0].rightAtrribute.forEach((specialRightRule) => {
						console.log('special right rule', specialRightRule);
						
						let specialRuleInRulesConditionProcessedList = rulesConditionProcessedList.filter((rule) => (
							rule.deficiencyObj.coverageTypeId === specialRuleLeftAttributeExists[0].coverageTypeId &&
							rule.deficiencyObj.attributeId === specialRightRule.id
						));
						console.log('specialRuleInRulesConditionProcessedList', specialRuleInRulesConditionProcessedList);
						if (specialRuleInRulesConditionProcessedList.length) {
							console.log('THE RIGHT SPECIAL RULE IS NOT OK');
							specialRuleRight.push(specialRuleInRulesConditionProcessedList[0]);
						} else {
							console.log('THE RIGHT SPECIAL RULE IS OK');
						}
					});

					if (specialRuleRight.length) {
						console.log('THE LEFT SPECIAL RULE IS NOT OK && SOME RIGHT SPECIAL RULES ARE NOT OK TOO');
					} else {
						console.log('THE LEFT SPECIAL RULE IS NOT OK && ALL RIGHT SPECIAL RULES ARE OK!!!!!');
						rule.deficiencyObj.deficiencyText += ` ${specialRuleLeftAttributeExists[0].leftDeficiencyText}`;
					}

				}
			}
			if (specialRuleRightAttributeExists.length) {
				console.log('THIS RULE IS IN A SPECIAL RULE IN THE RIGHT');

				if (!rule.conditionIsOk) {
					console.log('THIS RULE IS NOT OK');

					if (specialRuleRightAttributeCoverageExist.length) {
						console.log('LEFT RULE ASSOCIATED', specialRuleRightAttributeCoverageExist[0].leftAtrribute);

						let specialRuleInRulesConditionProcessedList = rulesConditionProcessedList.filter((rule) => (
							rule.deficiencyObj.coverageTypeId === specialRuleRightAttributeCoverageExist[0].coverageTypeId &&
							rule.deficiencyObj.attributeId === specialRuleRightAttributeCoverageExist[0].leftAtrribute.id
						));
						console.log('specialRuleInRulesConditionProcessedList', specialRuleInRulesConditionProcessedList);
						if (specialRuleInRulesConditionProcessedList.length) {
							console.log('THE RIGHT SPECIAL RULE IS NOT OK && LEFT SPECIAL RULES IS NOT OK TOO');
						} else {
							console.log('THE RIGHT SPECIAL RULE IS NOT OK && LEFT SPECIAL RULES ARE OK!!!!!');
							rule.deficiencyObj.deficiencyText += ` ${specialRuleRightAttributeCoverageExist[0].rightDeficiencyText}`;
						}

					}

				}

			}

			if (!rule.conditionIsOk) {
				console.log('deficiencyObj ::', rule.deficiencyObj, certificateId);
				rule.deficiencyObj.certificateId = certificateId;
				insertDeficienciesRules(rule.deficiencyObj);
				hasMajorDeficiency = true;
			}
		});
*/