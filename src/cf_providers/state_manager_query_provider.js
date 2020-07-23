exports.getUpdateAttrStatusQuery = (projectInsuredId, ruleGroupId, ruleId, status) => {
	let query = `UPDATE Coverages_CoveragesAttributes_Status
			SET CoverageAttributeStatusID = ${status}
			WHERE ProjectInsuredID = ${projectInsuredId}
			AND RuleGroupID = ${ruleGroupId} 
			AND RuleID = ${ruleId}`

	console.log('getUpdateAttrStatusQuery: ', query);	
	return query;		
}


exports.getCheckAttrsStatusQuery = (projectInsuredId, ruleGroupId, status) => {
	let query = `SELECT DISTINCT COUNT(1) AS attrsLeft
							FROM Coverages_CoveragesAttributes_Status
							WHERE ProjectInsuredID = ${projectInsuredId}
							AND RuleGroupID = ${ruleGroupId} 
							AND CoverageAttributeStatusID != ${status}`
	
	if (status === 3){
			query += ` AND CoverageAttributeStatusID != 4 `
	} 	
	console.log('getCheckAttrsStatusQuery: ', query);	
	return query;
}


exports.getUpdateCoverageStatusQuery = (projectInsuredId, ruleGroupId, status) => {
	let query = `UPDATE Coverages_CoveragesAttributes_Status
				SET CoverageStatusID = ${status}
				WHERE ProjectInsuredID = ${projectInsuredId}
				AND RuleGroupID = ${ruleGroupId}`

	console.log('getUpdateCoverageStatusQuery: ', query);	
	return query;		
}

exports.getCheckCoveragesAcceptedQuery = (projectInsuredId) =>{
	let query = `SELECT DISTINCT COUNT(1) AS covsLeft
			FROM Coverages_CoveragesAttributes_Status
			WHERE ProjectInsuredID = ${projectInsuredId}
			AND CoverageStatusID NOT IN (3, 4)`
	
	console.log('getCheckCoveragesAcceptedQuery: ', query);	
	return query;				
}

exports.getUpdateComplianceStatusQuery = (projectInsuredId, status) => {
	let query = `UPDATE ProjectsInsureds
			SET ComplianceStatusID = ${status}
			WHERE ProjectInsuredID = ${projectInsuredId}`
	
	console.log('getUpdateComplianceStatusQuery: ', query);	
	return query;				
}



exports.getEscalateAttrQuery = (projectInsuredId, ruleGroupId, ruleId, currentState) => {
	
	let query = `UPDATE Coverages_CoveragesAttributes_Status `
	
	switch(currentState){
		case 2:
			query += `SET CoverageAttributeStatusID = 13 `
			break
		case 1:
			query += `SET CoverageAttributeStatusID = 9 `
			break
		case 12:
			query += `SET CoverageAttributeStatusID = 8 `
			break
		case 5:
			query += `SET CoverageAttributeStatusID = 7 `
			break
		default:
			query += `SET CoverageAttributeStatusID = 12 `
	}

	query += `WHERE ProjectInsuredID = ${projectInsuredId}
				AND RuleGroupID = ${ruleGroupId} 
				AND RuleID = ${ruleId}`

	return query		
}



exports.getExpiryAttrQuery = (projectInsuredId, ruleGroupId, ruleId, currentState) => {
	
	let query = `UPDATE Coverages_CoveragesAttributes_Status `
	
	switch(currentState){
		case 5:
			query += `SET CoverageAttributeStatusID = 6 `
			break
		default:
			query += `SET CoverageAttributeStatusID = 12 `
	}

	query += `WHERE ProjectInsuredID = ${projectInsuredId}
				AND RuleGroupID = ${ruleGroupId} 
				AND RuleID = ${ruleId}`

	return query		
}