exports.generateRulesQuery = (params) => {
	
	let query = `SELECT R.*, A.AttributeName FROM dbo.Rules R
		INNER JOIN dbo.Attributes A ON A.AttributeID = R.AttributeID 
		WHERE 1=1`;
 	
	if(params.ruleId)
		query += ` AND R.RuleID = ${params.ruleId}`;
	if(params.ruleGroupId)
		query += ` AND R.RuleGroupID = ${params.ruleGroupId}`;
	if(params.attributeId)
		query += ` AND R.AttributeID = ${params.attributeId}`;
	if(params.conditionTypeId)
		query += ` AND R.ConditionTypeID = ${params.conditionTypeId}`;			
	if(params.conditionValue)
		query += ` AND R.ConditionValue LIKE '%${params.conditionValue}%'`;	
	if(params.deficiencyTypeId)
		query += ` AND R.DeficiencyTypeID = ${params.deficiencyTypeId}`;			
	if(params.deficiencyText)
		query += ` AND R.DeficiencyText LIKE '%${params.deficiencyText}%'`;

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

	//console.log('QUERY', query);
	return query;
}

exports.generateRulesInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Rules (
		RuleGroupID
		, AttributeID
		, ConditionTypeID
		, ConditionValue
		, DeficiencyTypeID
		, DeficiencyText
	) VALUES (
		${params.ruleGroupId}
		,${params.attributeId}
		,${params.conditionTypeId}
		,'${params.conditionValue}'
		,${params.deficiencyTypeId}
		,'${params.deficiencyText}'
	)`;

	console.log('generateRulesInsertQuery: ', query);
	return query;
}


exports.generateRulesUpdateQuery = (params) => {

	let query = `UPDATE dbo.Rules SET `;
	
	if(params.ruleGroupId)
		query += `RuleGroupId = ${params.ruleGroupId},`;
	
	if(params.attributeId)
		query += `AttributeID = ${params.attributeId},`;	
	
	if(params.conditionTypeId)
		query += `ConditionTypeID = ${params.conditionTypeId},`;		
	
	if(params.conditionValue !== 'undefined')
		query += `ConditionValue = '${params.conditionValue}',`;
	
	if(params.deficiencyTypeId)
		query += `DeficiencyTypeID = ${params.deficiencyTypeId},`;	

	if(params.deficiencyText)
		query += `DeficiencyText = '${params.deficiencyText}',`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE RuleId = ${params.ruleId}`;

	console.log('generateRulesUpdateQuery: ', query);
	return query;
}

exports.generateRulesDeleteQuery = (params) => {

	let query = `DELETE dbo.Rules WHERE RuleId = ${params.ruleId}`;

	return query;
}

exports.generateRulesDeleteByRuleGroupIdQuery = (params) => {

	let query = `DELETE dbo.Rules WHERE RuleGroupId = ${params.ruleGroupId}`;
	
	return query;
}

exports.generateDuplicateRulesInsertQuery = (params) => {
	console.log('params', params);

	let query = `INSERT INTO dbo.Rules (
			RuleGroupID
			, AttributeID
			, ConditionTypeID
			, ConditionValue
			, DeficiencyTypeID
			, DeficiencyText
		)
			SELECT 
				(SELECT RuleGroupID FROM RuleGroups WHERE RequirementSetID = ${params.newReqSetId} AND CoverageTypeID = RG.CoverageTypeID) AS RuleGroupID
				, AttributeID
				, ConditionTypeID
				, ConditionValue
				, DeficiencyTypeID
				, DeficiencyText
			FROM dbo.RuleGroups RG
			LEFT JOIN dbo.Rules R ON R.RuleGroupID = RG.RuleGroupID
			WHERE RG.RuleGroupID IN (SELECT RuleGroupID FROM RuleGroups WHERE RequirementSetID = ${params.reqSetId})`;

	console.log('QUERY', query);
	return query;
}
