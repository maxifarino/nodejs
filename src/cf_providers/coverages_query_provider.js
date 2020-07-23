/*
exports.generateCoveragesQuery = (params) => {
	
	let query = `SELECT 
		C.*
		, CT.*
		,	A.Name AS AgencyName
		, CONCAT(AG.FirstName,' ', AG.LastName) AS AgentName
		, CA.CoverageAttributeID
		, CA.AttributeValue
		, ATT.AttributeName
		, ATT.AttributeDataTypeID
		FROM dbo.Coverages C
			INNER JOIN dbo.CoveragesTypes CT ON CT.CoverageTypeID = C.CoverageTypeID
			INNER JOIN dbo.Agencies A ON A.AgencyID = C.AgencyID
			INNER JOIN dbo.Agents AG ON AG.AgentID = C.AgentID
			LEFT JOIN dbo.CoverageAttributes CA ON CA.CoverageID = C.CoverageID
			LEFT JOIN dbo.Attributes ATT ON ATT.AttributeID = CA.AttributeID
		WHERE 1=1`;
		
	(params.parentCoverageId) 
		? query += ` AND C.ParentCoverageID = ${params.parentCoverageId}`
		: query += ` AND C.ParentCoverageID = 0`;
		
	if(params.coverageId)
		query += ` AND C.CoverageID = ${params.coverageId}`;		
	if(params.coverageTypeId)
		query += ` AND C.CoverageTypeID = ${params.coverageTypeId}`;
	if(params.agencyId)
		query += ` AND C.AgencyID = ${params.agencyId}`;
	if(params.agentId)
		query += ` AND C.AgentID = ${params.agentId}`;
	if(params.coverageTypeName)
		query += ` AND CT.Name LIKE '%${params.coverageTypeName}%'`;	
	if(params.agencyName)
		query += ` AND A.Name LIKE '%${params.agencyName}%'`;	

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

exports.generateCoveragesInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Coverages (
		ParentCoverageID
		, CoverageTypeID
		, AgencyID
		, AgentID
	) VALUES (
		${params.parentCoverageId || 0}
		,${params.coverageTypeId}
		,${params.agencyId}
		,${params.agentId}
	)`;
	//console.log(query)
	return query;
}

exports.generateCoveragesUpdateQuery = (params) => {

	let query = `UPDATE dbo.Coverages`;
	
	if(params.parentCoverageId)
		query += `ParentCoverageID = ${params.parentCoverageId},`;		
	if(params.coverageTypeId)
		query += `CoverageTypeID = ${params.coverageTypeId},`;		
	if(params.agencyId)
		query += `AgencyID = ${params.agencyId},`;		
	if(params.agentId)
		query += `AgentID = ${params.agentId},`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE CoverageID = ${params.coverageId}`;

	//console.log('QUERY', query);
	return query;
}
*/
exports.generateCoveragesDeleteQuery = (params) => {

	let query = `DELETE dbo.Coverages WHERE CoverageID = ${params.coverageId}`;

	return query;
}


exports.generateCoverageExpirations = (params) => {
	console.log('PARAMS', params);
	
	let query = `SELECT 
		C.*
		, CT.*
		,	A.Name AS AgencyName
		, CONCAT(AG.FirstName,' ', AG.LastName) AS AgentName
		, CA.CoverageAttributeID
		, CA.AttributeValue
		, ATT.AttributeName
		, ATT.AttributeDataTypeID
		FROM dbo.Coverages C
			INNER JOIN dbo.CoveragesTypes CT ON CT.CoverageTypeID = C.CoverageTypeID
			INNER JOIN dbo.Agencies A ON A.AgencyID = C.AgencyID
			INNER JOIN dbo.Agents AG ON AG.AgentID = C.AgentID
			LEFT JOIN dbo.CoverageAttributes CA ON CA.CoverageID = C.CoverageID
			LEFT JOIN dbo.Attributes ATT ON ATT.AttributeID = CA.AttributeID
		WHERE 1=1`;
		
	console.log('QUERY', query);
	return query;
}

exports.generateCoveragesTopLayersQuery = (params) => {
	let query = `
		SELECT 
			CTL.ProjectInsuredID,
			CTL.CertificateID,
			COI.DocumentId AS DocumentID,
			CTL.[TimeStamp] AS UploadedDate,
			1 AS TopLayer
			FROM dbo.Coverages_TopLayers CTL
			INNER JOIN dbo.CertificateOfInsurance COI ON COI.CertificateID = CTL.CertificateID
			WHERE CTL.CoverageTypeID = ${params.coverageTypeId}
			AND CTL.ProjectInsuredID = ${params.projectInsuredId}
		UNION
		SELECT
			CI.ProjectInsuredID,
			CI.CertificateID,
			COI.DocumentId AS DocumentID,
			COI.Created AS UploadedDate,
			NULL AS TopLayer
			FROM dbo.ProjectInsureds_CertificateOfInsurance CI
			INNER JOIN dbo.Coverages C ON C.CertificateID = CI.CertificateID
			INNER JOIN dbo.CertificateOfInsurance COI ON COI.CertificateID = CI.CertificateID
			WHERE C.CoverageTypeID = ${params.coverageTypeId}
			AND CI.ProjectInsuredID = ${params.projectInsuredId}
			AND CI.CertificateID NOT IN (
				SELECT
				CertificateID
				FROM dbo.Coverages_TopLayers 
				WHERE CoverageTypeID = ${params.coverageTypeId}
				AND ProjectInsuredID = ${params.projectInsuredId}
			)
		`;

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;

		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	} else {
		query += ` ORDER BY TopLayer DESC, CertificateID DESC`;
	}
	console.log('generateCoveragesTopLayersQuery: ', query);
	return query;
}

exports.generateCoveragesTopLayersInsertQuery = (params) => {
	let query = `DELETE FROM dbo.Coverages_TopLayers 
		WHERE ProjectInsuredID = ${params.projectInsuredId} 
		AND CoverageTypeID = ${params.coverageTypeId};
		INSERT INTO dbo.Coverages_TopLayers (
			CoverageTypeID
			, ProjectInsuredID
			, CertificateID
		) VALUES (
			${params.coverageTypeId}
			,${params.projectInsuredId}
			,${params.certificateId}
		)`;
	console.log('generateCoveragesTopLayersInsertQuery: ', query);
	return query;
}


exports.getCoveragesAndAttributesStatusQuery = (params) => {
	const query = ` SELECT *
					FROM [dbo].[vw_MasterCoverageAttributesStatus]
					WHERE ProjectInsuredID = ${params.projectInsuredId}	
					ORDER BY 
						DisplayOrder,
						RuleGroupID,
						RuleID
					ASC`;
	console.log('getCoveragesAndAttributesStatusQuery: ', query);		
	return query;
}
