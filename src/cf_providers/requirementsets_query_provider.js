exports.generateRequirementSetsQuery = (params) => {
	console.log('PARAMS', params)

	let query = `SELECT RS.*, 
			ISNULL(HC.Name,'<< MASTER TEMPLATE >>') AS HolderName,
			HC.Id AS HolderSetID,
			(Select COUNT(*)
				FROM  RequirementSets rst,
							ProjectRequirementSets prs,
							Projects p
				WHERE rst.Id = prs.RequirementSetID AND
							p.Id = prs.ProjectID AND
							p.Archived = 0 AND
							rst.Id = RS.Id) as totalOfActiveProyects,
			(SELECT COUNT (*) FROM dbo.RuleGroups WHERE RequirementSetID = RS.Id) AS HasRuleGroup
		FROM dbo.RequirementSets RS 		
		LEFT JOIN dbo.HiringClients HC ON HC.Id = RS.HolderId					
		WHERE 1=1`;
 	
	if(params.holderId && params.templates !== 'master')
		query += ` AND RS.HolderId = ${params.holderId}`;
	if(params.holderId && params.templates === 'master')
		query += ` AND (RS.HolderId = ${params.holderId} OR RS.HolderId IS NULL)`;


	if(params.requirementSetId)
		query += ` AND RS.Id = ${params.requirementSetId}`;
	if(params.name)
		query += ` AND RS.Name LIKE '%${params.name}%'`;
	if(params.description)
		query += ` AND RS.Description LIKE '%${params.description}%'`;
	if(typeof params.archived !== 'undefined')
		query += ` AND RS.Archived = ${params.archived}`;
	if(typeof params.template !== 'undefined')
		query += ` AND RS.Template = ${params.template}`;
	if(params.holderSetId)
		query += ` AND HC.Id = ${params.holderSetId}`;	

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}

	if(params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
	}

	console.log('generateRequirementSetsQuery: ', query);
	return query;
}

exports.generateRequirementSetsInsertQuery = (params) => {

	let query = `DECLARE @lastInsertedReqSetId AS INT`;
	
	query += ` INSERT INTO dbo.RequirementSets (
		Name
		, Description
		, Archived
		, Template`;

	if(params.holderId)
		query += `, HolderId`;	

	query += `) VALUES (
				'${params.name}'
				,'${params.description}'
				, ${params.archived || 0}
				, ${params.template || 0}
		`;
	if(params.holderId)
		query += `, ${params.holderId}`;
	
	query += `);`;

	query += ` SET @lastInsertedReqSetId = SCOPE_IDENTITY();`;

	if(params.holderId) {
		query += ` INSERT INTO dbo.RequirementSets_Endorsements 
			(EndorsementID, RequirementSetID)
			SELECT Id, @lastInsertedReqSetId FROM dbo.Endorsements 
			WHERE HolderId = ${params.holderId}
			AND AlwaysVisible = 1;`;
	}

	console.log('QUERY', query);
	return query;
}


exports.generateRequirementSetsUpdateQuery = (params) => {

	let query = `UPDATE dbo.RequirementSets SET `;
	
	if(params.holderId)
		query += `HolderId = ${params.holderId},`;
	
	if(params.name)
		query += `Name = '${params.name}',`;

	if(params.description)
		query += `Description = '${params.description}',`;

	if(typeof params.archived !== 'undefined')
		query += `Archived = ${params.archived || 0},`;	

	if(typeof params.template !== 'undefined')
		query += `Template = ${params.template || 0},`;	

		// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE Id = ${params.requirementSetId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateRequirementSetsDeleteQuery = (params) => {

	let query = `DELETE dbo.RequirementSets WHERE Id = ${params.requirementSetId}`;

	return query;
}

exports.generateRequirementSetsDetailQuery = (params) => {
	
	let query = `SELECT DISTINCT
		RS.Id, 
		RS.HolderId,
		RS.Name, 
		RS.Description, 
		RS.Archived,
		H.Name AS HolderName,
		RG.RuleGroupID, 
		RG.RuleGroupName, 
		RG.CoverageTypeID,
		R.RuleID, 
		R.AttributeID, 
		R.ConditionTypeID, 
		R.ConditionValue,
		R.DeficiencyTypeID, 
		R.DeficiencyText, 
		A.AttributeName, 
		A.AttributeDataTypeID
		,(
			SELECT TOP 1 CAS.CoverageAttributeStatus
				FROM dbo.CoverageAttributes CA 
				INNER JOIN dbo.CoverageAttributes_Status CAS 
				ON CAS.CoverageAttributeStatusID = CA.CoverageAttributeStatusID
				INNER JOIN dbo.Coverages C ON
				C.CoverageID = CA.CoverageID
				WHERE CA.AttributeID = R.AttributeID
		) AS CoverageAttributeStatus
		, HCT.DisplayOrder
		FROM dbo.RequirementSets RS
		INNER JOIN dbo.HiringClients H ON H.Id = RS.HolderId
		INNER JOIN dbo.RuleGroups RG ON RG.RequirementSetID = RS.Id
		INNER JOIN dbo.Rules R ON R.RuleGroupID = RG.RuleGroupID
		INNER JOIN dbo.Attributes A ON A.AttributeID = R.AttributeID		 
		INNER JOIN ProjectRequirementSets PRS ON PRS.RequirementSetID = RS.Id
		INNER JOIN HolderCoveragesTypes HCT ON RG.CoverageTypeID = HCT.CoverageTypeID AND HCT.HolderID = H.Id
		WHERE 1=1`;

	if(params.coverageArchived)
		query += ` AND HCT.Archived = ${params.coverageArchived}`;
	if(params.requirementSetId)
		query += ` AND RS.Id = ${params.requirementSetId}`;
	if(params.holderId)
		query += ` AND RS.HolderId = ${params.holderId}`;
	if(params.name)
		query += ` AND RS.Name LIKE '%${params.name}%'`;
	if(typeof params.archived !== 'undefined')
		query += ` AND RS.Archived = ${params.archived}`;	
	if(params.ruleGroupId)
		query += ` AND RG.RuleGroupId = ${params.ruleGroupId}`;
	if(params.ruleGroupName)
		query += ` AND RG.RuleGroupName LIKE '%${params.ruleGroupName}%'`;
	if(params.coverageTypeId)
		query += ` AND RG.CoverageTypeID = ${params.coverageTypeId}`;	
	if(params.ruleId)
		query += ` AND R.RuleID = ${params.ruleId}`;	
	if(params.attributeId)
		query += ` AND R.AttributeID = ${params.attributeId}`;		
	if(params.conditionTypeId)
		query += ` AND R.ConditionTypeID = ${params.conditionTypeId}`;		
	if(params.deficiencyTypeId)
		query += ` AND R.DeficiencyTypeID = ${params.deficiencyTypeId}`;		
	if(params.deficiencyText)
		query += ` AND R.DeficiencyText LIKE '%${params.deficiencyText}%'`;
	if(params.attributeName)
		query += ` AND A.AttributeName LIKE '%${params.attributeName}%'`;	
	if(params.projectId)
		query += ` AND PRS.ProjectId = ${params.projectId}`;	

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}

	if(params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
	}

	console.log('RequirementSetsDetailQuery: ', query);
	return query;
}

exports.generateHolderSetIdsQuery = (params) => {
	
	let query = `SELECT DISTINCT
		RS.HolderId AS HolderSetID
		FROM dbo.RequirementSets RS
		WHERE RS.HolderId IS NOT NULL`;

	console.log('QUERY', query);
	return query;
}

exports.generateDuplicateRequirementSetsInsertQuery = (params) => {
	let query = `INSERT
			INTO dbo.RequirementSets (
				Name
				, Description
				, HolderId
			)
			OUTPUT INSERTED.id
			SELECT 
				CONCAT('Copy of ', Name)
				, Description
				,  ${params.holderId}
			FROM dbo.RequirementSets 
			WHERE id = ${params.reqSetId}`;
	return query;
}

exports.generateHolderCoverageTypesQuery = (params) => {

	let query = `SELECT 
		HCT.CoverageTypeID
		, CT.Name
		, CT.Code
		, RG.RuleGroupID
		, RG.RuleGroupName
		FROM dbo.HolderCoveragesTypes HCT
		INNER JOIN dbo.CoveragesTypes CT ON HCT.CoverageTypeID = CT.CoverageTypeID
		INNER JOIN dbo.RequirementSets RS ON RS.HolderId = HCT.HolderID
		INNER JOIN dbo.ProjectRequirementSets PRS ON PRS.RequirementSetID = RS.id
		INNER JOIN dbo.RuleGroups RG ON RG.RequirementSetID = PRS.RequirementSetID 
		AND RG.CoverageTypeID = CT.CoverageTypeID
		WHERE HCT.HolderID = ${params.holderId}`;
		
	if(params.projectId)
		query += ` AND PRS.ProjectId = ${params.projectId}`;
	
	query += ` ORDER BY HCT.DisplayOrder`;

	console.log('generateHolderCoverageTypesQuery: ', query);
	return query;
}