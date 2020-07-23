const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const requirementsets_query_provider = require('../cf_providers/requirementsets_query_provider');

const rulegroups_query_provider = require('../cf_providers/rulegroups_query_provider');
const rules_query_provider = require('../cf_providers/rules_query_provider')
const endorsements_query_provider = require('../cf_providers/endorsements_query_provider');
const requirementsets_endorsements_query_provider = require('../cf_providers/requirementsets_endorsements_query_provider');

exports.getRequirementSets = async (params, callback) => {
	let totalCount = 0;
	let countResult = 0;
	let result = {};	
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = requirementsets_query_provider.generateRequirementSetsQuery(params);
		result = await connection.request().query(query);
		
		if(result.recordset.length > 0)
			totalCount = result.recordset.length;
		//console.log('Result: '+result.recordset)

		if (params.pageSize) {
			params.getTotalCount = true;
			query = requirementsets_query_provider.generateRequirementSetsQuery(params);
			countResult = await connection.request().query(query);
			
			if(countResult.recordset.length > 0)
				totalCount = countResult.recordset.length;
		}
		//console.log('totalCount: '+ totalCount)
		connection.close();		
		callback(null, result.recordset, totalCount);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.createRequirementSets = async (params, callback) => {	
	
	let query = requirementsets_query_provider.generateRequirementSetsInsertQuery(params);
	query = sql_helper.getLastIdentityQuery(query,'requirementSets');

	sql_helper.createTransaction(query, (err, result, requirementSetId) => {
		if(err) {
			return callback(err);
		}
		callback(null, result, requirementSetId);
	});
};

exports.updateRequirementSets = async (params, callback) => {
	//console.log(JSON.stringify(params))
	let query = requirementsets_query_provider.generateRequirementSetsUpdateQuery(params);

	sql_helper.createTransaction(query, (err, result) => {
		if(err) {
			return callback(err);
    }
		callback(null, result, params.requirementSetId);
	});
};

exports.removeRequirementSets = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
    let query = requirementsets_query_provider.generateRequirementSetsDeleteQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, true);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.getRequirementSetsDetail = async (params, callback) => {
	let requirementSetDetails = [];
	let availableEndorsements = [];
	let totalCount = 0;
	let countResult = 0;
	params.getTotalCount = false;

  try {		
		const connection = await sql_helper.getConnection();		
		let query = requirementsets_query_provider.generateRequirementSetsDetailQuery(params);
		let requirementSetsDetailResults = await connection.request().query(query);
		requirementSetDetails = requirementSetsDetailResults.recordset;

		if(requirementSetDetails.length > 0)
			totalCount = requirementSetDetails.length;

		if (params.pageSize) {
			params.getTotalCount = true;
			query = requirementsets_query_provider.generateRequirementSetsDetailQuery(params);
			countResult = await connection.request().query(query);
			
			if(countResult.recordset.length > 0)
				totalCount = countResult.recordset.length;
		}
		//console.log('totalCount: '+ totalCount)

		let availableCoverages = [];
		if (params.holderId) {
			query = requirementsets_query_provider.generateHolderCoverageTypesQuery(params);
			let availableCoveragesResult = await connection.request().query(query);
			//console.log(availableCoveragesResult);
			availableCoverages = availableCoveragesResult.recordset
		}

		let allEndorsements = [];
		let reqSetEndorsements = [];		
		
		if (requirementSetDetails && requirementSetDetails.length > 0) {
			// get all endorsements by holderId
			query = endorsements_query_provider.generateEndorsementsQuery({ holderId: params.holderId });
			let allEndorsementsResult = await connection.request().query(query);
			allEndorsements = allEndorsementsResult.recordset;
			// console.log(allEndorsements);
			
			// get endorsements for the reqSet
			query = requirementsets_endorsements_query_provider.generateRequirementSetsEndorsementsQuery({ requirementSetId: requirementSetDetails[0].Id });
			let reqSetEndorsementsResult = await connection.request().query(query);
			reqSetEndorsements = reqSetEndorsementsResult.recordset;
			// console.log(reqSetEndorsements);

			// filter both endorsements results
			reqSetEndorsements.forEach((e) => {
        if (! availableEndorsements.some((f) => f.Id === e.Id)) {
          availableEndorsements.push({
            Id: e.EndorsementID,
            Name: e.EndorsementName,
            requirementSetEndorsementId: e.RequirementSet_EndorsementID,
            AlwaysVisible: e.AlwaysVisible
          });
        }        
			});
			allEndorsements.forEach((e) => {
        if ((e.AlwaysVisible === true) && (! availableEndorsements.some((f) => f.Id === e.Id))) {
          availableEndorsements.unshift(e);
        }
      });			
		}
		// console.log('AVAILABLE ENDORSEMENTS', availableEndorsements);
		connection.close();		
		callback(null, requirementSetDetails, totalCount, availableCoverages, availableEndorsements);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

exports.getHolderSetIds =  async (params, callback) => {
	let result = {};
  try {		
		const connection = await sql_helper.getConnection();		
		let query = requirementsets_query_provider.generateHolderSetIdsQuery(params);
		result = await connection.request().query(query);
		connection.close();		
		callback(null, result.recordset);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};

const associateUnassociatedCoverageTypes = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
		const { reqSetId, holderId } = params;
		const queryProyectReqSet = `
		SELECT ct.*
		FROM RuleGroups rg,
			CoveragesTypes ct
		WHERE rg.CoverageTypeID = ct.CoverageTypeID AND
		 rg.RequirementSetID = ${reqSetId}`;
		 const resultProyectReqSet = await connection.request().query(queryProyectReqSet);
		if (resultProyectReqSet.recordset.length === 0) return;
		for (let reqset of resultProyectReqSet.recordset) {
			const { CoverageTypeID } = reqset;
			const queryHolderCoveragesTypes = `SELECT * FROM HolderCoveragesTypes hct WHERE hct.CoverageTypeID = ${CoverageTypeID} AND hct.HolderID = ${holderId}`;
			const resultHolderCoveragesTypes = await connection.request().query(queryHolderCoveragesTypes);
			if (resultHolderCoveragesTypes.recordset.length === 0) await associateCoverageTypeToHolder(CoverageTypeID, holderId);
		}
	} catch (e) {
		callback(e, null);
	};
};

const associateCoverageTypeToHolder = async (coverageTypeID, holderId) => {
	try {
		const insertQuery = `INSERT INTO dbo.HolderCoveragesTypes (
			HolderID
			, CoverageTypeID
			, DisplayOrder
			, Archived
		) VALUES (
			${holderId}
			, ${coverageTypeID}
			, 0
			, 0
		)`;
		const connection = await sql_helper.getConnection();
		await connection.request().query(insertQuery);
	} catch (e) {
		callback(e, null);
	};
};

const associateUnassociatedEndorsements = async (params, callback) => {
	try {
		const connection = await sql_helper.getConnection();
		const { reqSetId, holderId } = params;
		const queryGetRequirementSetsEndorsements = `
		SELECT *
		FROM RequirementSets_Endorsements re
		WHERE re.RequirementSetID = ${reqSetId}`;
		 const resultGetRequirementSetsEndorsements = await connection.request().query(queryGetRequirementSetsEndorsements);
		if (resultGetRequirementSetsEndorsements.recordset.length === 0) return;
		for (let endorsement of resultGetRequirementSetsEndorsements.recordset) {
			const { EndorsementID } = endorsement;
			const queryGetHolderEndorsement = `SELECT * FROM Endorsements e WHERE e.Id = ${EndorsementID} AND e.HolderId = ${holderId}`;
			const resultGetHolderEndorsement = await connection.request().query(queryGetHolderEndorsement);
			if (resultGetHolderEndorsement.recordset.length === 0) await associateEndorsementToHolder(EndorsementID, holderId);
		}
	} catch (e) {
		callback(e, null);
	};
};

const associateEndorsementToHolder = async (EndorsementID, holderId) => {
	try {
		const queryGetEndorsement = `SELECT * FROM Endorsements e WHERE e.Id = ${EndorsementID}`;
		const connection = await sql_helper.getConnection();
		const resultGetEndorsement = await connection.request().query(queryGetEndorsement);
		const { Name, URL, Code, AlwaysVisible } = resultGetEndorsement.recordset[0];
		const insertQuery = `INSERT INTO dbo.Endorsements (
			HolderId
			, Name
			, URL		
			, Code
			, AlwaysVisible
		) VALUES (
			${holderId}
			,'${Name}'
			,'${URL}'
			,'${Code}'
			,${AlwaysVisible ? 1 : 0}
		)`;
		await connection.request().query(insertQuery);
	} catch (e) {
		callback(e, null);
	};
};

exports.createDuplicateRequirementSets = async (params, callback) => {	
	let result = {};
  try {		
		const connection = await sql_helper.getConnection();
		await associateUnassociatedCoverageTypes(params, callback);
		await associateUnassociatedEndorsements(params, callback);
		let query = requirementsets_query_provider.generateDuplicateRequirementSetsInsertQuery(params);
		result = await connection.request().query(query);
		let newReqSetId = result.recordset[0].id;

		let ruleGroupParams = {
			...params,
			newReqSetId: newReqSetId
		}
		query = rulegroups_query_provider.generateDuplicateRuleGroupsInsertQuery(ruleGroupParams);
		result = await connection.request().query(query);

		let rulesParams = {
			...params,
			newReqSetId: newReqSetId,
			newRuleGroupsId: result.recordset
		}
		query = rules_query_provider.generateDuplicateRulesInsertQuery(rulesParams);
		result = await connection.request().query(query);

		connection.close();		
		callback(null, result);
	}
	catch(err) {
		console.log(err);
		callback(err, null);
	}
};