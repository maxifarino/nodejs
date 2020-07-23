exports.generateCoverages_CoveragesAttributes_ProjectInsuredStatusComplianceQuery = (params) => {
	
	let query = `SELECT * FROM vw_MasterCoverageAttributesStatus VWM
	WHERE VWM.ProjectInsuredID = ${params.projectInsuredId}`;
 	
	return query;
}

exports.generateCoverages_CoveragesAttributes_StatusInsertQuery = (params) => {
	
	let query = `INSERT INTO dbo.Coverages_CoveragesAttributes_Status (
    RuleGroupID,
    RuleID,
    AttributeID,
    AttributeName,
    ConditionTypeID,
    ConditionValue,
    CoverageTypeID,
    CoverageTypeName,	
    CoverageAttributeValue,
    CoverageStatusID,
    CoverageAttributeStatusID,
		CertificateId,
		ProjectInsuredId,
		CoverageID,
		CoverageAttributeID,
		EffectiveDate,
		ExpirationDate,
		CreatedDate
	) VALUES (
		'${params.ruleGroupId}'
		,${params.ruleId}
		,${params.attributeId}
		,'${params.attributeName}'
		,${params.conditionTypeId}
		,'${params.conditionValue}'
		,${params.coverageTypeId}
    ,'${params.coverageTypeName}'
    ,'${params.coverageAttributeValue}'
		,${params.coverageStatusId}
		,${params.coverageAttributeStatusId}
		,${params.certificateId}
		,${params.projectInsuredId}
		,${params.coverageId}
		,${params.coverageAttributeId}
		,'${params.effectiveDate}'
		,'${params.expirationDate}'
		,getDate()
	);`;
		// console.log('QUERY', query);
	return query;
}

exports.generateCoverages_CoveragesAttributes_StatusDeleteQuery = (params) => {
	let query = `DELETE dbo.Coverages_CoveragesAttributes_Status WHERE `;
	let where = [];
	if(params.certificateId || params.certificateId == 0) where.push(`CertificateID = ${params.certificateId}`);	
	if(params.projectInsuredId) where.push(`ProjectInsuredID = ${params.projectInsuredId}`);	
	if(params.ruleGroupId) where.push(`RuleGroupID = ${params.ruleGroupId}`);	
	if(params.ruleId) where.push(`RuleID = ${params.ruleId}`);	

	query += (where.length && ` ${where.join(' AND ')}`) + ';';
	return query;
}


exports.generateCoveragesUpdateStatusQuery = (params) => {
	let query = `UPDATE dbo.Coverages_CoveragesAttributes_Status
		SET CoverageStatusID = ${params.coverageStatusId}
    WHERE CertificateId = ${params.certificateId}
    AND RuleGroupID = ${params.ruleGroupId};
	`;
	// console.log('QUERY', query);
	return query;
}

exports.generateCoveragesAttributesUpdateStatusQuery = (params) => {
	let query = `UPDATE dbo.Coverages_CoveragesAttributes_Status
		SET CoverageAttributeStatusID = ${params.coverageAttributeStatusId}`;
	if (params.coverageStatusId) query += `,CoverageStatusID = ${params.coverageStatusId} `;
	query += `
		WHERE CertificateId = ${params.certificateId}
    AND RuleGroupID = ${params.ruleGroupId}
    AND RuleID = ${params.ruleId};
	`;
	// console.log('QUERY', query);
	return query;
}

exports.generateCoverages_CoveragesAttributes_StatusUpdateQuery = (params) => {
	
	let query = `UPDATE dbo.Coverages_CoveragesAttributes_Status SET `;
	
	query += `ModifiedDate = getDate(),`;	

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE CertificateId = ${params.certificateId}`;

	console.log('QUERY', query);
	return query;
}