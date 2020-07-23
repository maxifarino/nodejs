exports.generateRuleGroupsQuery = (params) => {
	let query = `SELECT 
		RG.*
		, CT.Name AS CoverageTypeName
		,	(SELECT COUNT(p.Id) FROM Projects p, ProjectRequirementSets prs, RuleGroups s_rg, CoveragesTypes s_ct 
				WHERE p.Archived = 0
				AND prs.ProjectID = p.Id 
				AND s_rg.RequirementSetID =prs.RequirementSetID 
				AND s_ct.CoverageTypeID = s_rg.CoverageTypeID
				AND s_rg.RequirementSetID = RG.RequirementSetID`;

		if (params.holderId) {
			query+=`	AND p.HiringClientId = ${params.holderId}`;
		}

	query+=`) AS totalActiveProyects`;

	if (params.holderId) {
		query+=`, HCT.DisplayOrder`;
	}

	query+=` FROM dbo.RuleGroups RG
		INNER JOIN dbo.CoveragesTypes CT ON CT.CoverageTypeID = RG.CoverageTypeID`;

	if (params.holderId) {	
		query+=` INNER JOIN dbo.HolderCoveragesTypes HCT 
			ON HCT.CoverageTypeID = CT.CoverageTypeID AND HCT.HolderID = ${params.holderId}`;
	}

	query+=` WHERE 1=1`;
 	
	if(params.ruleGroupId)
	query += ` AND RG.RuleGroupID = ${params.ruleGroupId}`;
	if(params.ruleGroupName)
		query += ` AND RG.RuleGroupName LIKE '%${params.ruleGroupName}%'`;	
	if(params.requirementSetId)
		query += ` AND RG.RequirementSetID = ${params.requirementSetId}`;
	if(params.coverageTypeId)
		query += ` AND RG.CoverageTypeID = ${params.coverageTypeId}`;

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	} else if (params.holderId) {
		query += ` ORDER BY DisplayOrder ASC `;
	}

	if(params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
	}

	console.log('generateRuleGroupsQuery: ', query);
	return query;
}

exports.generateRuleGroupsInsertQuery = (params) => {

	let query = `INSERT INTO dbo.RuleGroups (
		RuleGroupName
		, RequirementSetID
		, CoverageTypeID
	) VALUES (
		'${params.ruleGroupName}'
		,${params.requirementSetId}
		,${params.coverageTypeId}
	)`;

	return query;
}


exports.generateRuleGroupsUpdateQuery = (params) => {

	let query = `UPDATE dbo.RuleGroups SET `;
	
	if(params.ruleGroupName)
		query += `RuleGroupName = '${params.ruleGroupName}',`;
	
	if(params.requirementSetId)
		query += `RequirementSetID = ${params.requirementSetId},`;	

	if(params.coverageTypeId)
		query += `CoverageTypeID = ${params.coverageTypeId},`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE RuleGroupID = ${params.ruleGroupId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateRuleGroupsDeleteQuery = (params) => {

	let query = `DELETE dbo.RuleGroups WHERE RuleGroupID = ${params.ruleGroupId}`;

	return query;
}

exports.generateDuplicateRuleGroupsInsertQuery = (params) => {
	console.log('params', params);

	let query = `INSERT INTO dbo.RuleGroups (
				RuleGroupName
				, RequirementSetID
				, CoverageTypeID
				)
			OUTPUT INSERTED.RuleGroupId
			SELECT 
				RuleGroupName
				, ${params.newReqSetId}
				, CoverageTypeID
			FROM dbo.RuleGroups 
			WHERE RequirementSetID = ${params.reqSetId}`;

	console.log('QUERY', query);
	return query;
}

exports.generateRuleGroupsDetailQuery = (params) => {
	let query = `SELECT
		PI.ProjectID ,PI.InsuredID, PI.ProjectInsuredStatusID, PI.ComplianceStatusID,
		RG.RuleGroupID, RG.RequirementSetID,
		R.RuleID, R.AttributeID, R.ConditionValue,
		CT.Name,
		A.AttributeName,
		CTL.CoverageTypeID, CTL.CertificateID,
		C.CoverageStatusID,
		CA.AttributeValue,CA.CoverageAttributeStatusID,
		CASE 
			WHEN R.ConditionTypeID IN(1,2,4) AND R.ConditionValue = CA.AttributeValue 
				THEN 'Compliant' 
			WHEN R.ConditionTypeID IN (5,6) AND CONVERT(INT, R.ConditionValue) <= CA.AttributeValue
				THEN 'Compliant'
			WHEN R.ConditionTypeID IN (6) AND CONVERT(INT, R.ConditionValue) < CA.AttributeValue
				THEN 'Compliant'
			ELSE 'Not Compliant'
		END ComplianceStatus,
		CAS.CoverageAttributeStatus AS CoverageStatus,
		CAS2.CoverageAttributeStatus,
		CI.DocumentId
		FROM ProjectsInsureds PI
		INNER JOIN ProjectRequirementSets PRS ON PI.ProjectID = PRS.ProjectID
		INNER JOIN RuleGroups RG ON RG.RequirementSetID = PRS.RequirementSetID
		INNER JOIN Rules R ON RG.RuleGroupID = R.RuleGroupID
		INNER JOIN CoveragesTypes CT ON CT.CoverageTypeID = RG.CoverageTypeID
		LEFT JOIN Attributes A ON R.AttributeID = A.AttributeID 
		LEFT JOIN Coverages_TopLayers CTL ON CTL.ProjectInsuredID = PI.ProjectInsuredID AND CTL.CoverageTypeID = RG.CoverageTypeID
		LEFT JOIN Coverages C ON C.CoverageTypeId = CTL.CoverageTypeID AND C.CertificateID = CTL.CertificateID
		LEFT JOIN CoverageAttributes CA ON CA.CoverageId = C.CoverageId AND A.AttributeID = CA.AttributeID
		LEFT JOIN CoverageAttributes_Status CAS ON CAS.CoverageAttributeStatusID = C.CoverageStatusID 
		LEFT JOIN CoverageAttributes_Status CAS2 ON CA.CoverageAttributeStatusID = CAS2.CoverageAttributeStatusID
		LEFT JOIN dbo.CertificateOfInsurance CI ON CI.CertificateId = CTL.CertificateID
		WHERE 1=1`;

		if(params.projectInsuredId)
			query += ` AND PI.ProjectInsuredID = ${params.projectInsuredId}`; // 10

		console.log('generateRuleGroupsDetailQuery: ', query);
		return query;
}