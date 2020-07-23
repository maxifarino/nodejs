exports.generateProjectInsuredCoveragesQuery = (params) => {
	
	/*
	  Change query by insuredId PI Group By
	  parentCoverageId
	*/
	let query = `SELECT 
		C.CoverageID
		,	C.ParentCoverageID
		, C.AgencyID
		, C.AgentID
		, C.EffectiveDate
		, C.ExpirationDate
		, CT.Name
		, PI.ProjectInsuredID
		, PI.ProjectID
		, PI.InsuredID
		, PI.ComplianceEndDate AS ExpireDate
		, S.StatusName AS Status
		, A.Name AS AgencyName
		, (
			SELECT COUNT(ProjectInsuredDeficiencyID) 
			FROM dbo.ProjectInsuredDeficiencies WHERE DeficiencyTypeID = 1
			AND ProjectInsuredID = PI.ProjectInsuredID
		) AS MajorDef
		, (
			SELECT COUNT(ProjectInsuredDeficiencyID) 
			FROM dbo.ProjectInsuredDeficiencies WHERE DeficiencyTypeID = 2
			AND ProjectInsuredID = PI.ProjectInsuredID
		) AS MinorDef
		, CD.DocumentID
		FROM dbo.Coverages C
		INNER JOIN dbo.CoveragesTypes CT ON CT.CoverageTypeID = C.CoverageTypeID
		INNER JOIN dbo.ProjectInsureds_Coverages PIC ON PIC.CoverageID = C.CoverageID
		INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectInsuredID = PIC.ProjectInsuredID
		INNER JOIN dbo.ProjectInsured_ComplianceStatus S ON S.ProjectInsuredComplianceStatusID = PI.ComplianceStatusID
		INNER JOIN dbo.Agencies A ON A.AgencyID = C.AgencyID
		INNER JOIN dbo.Coverage_Documents CD ON CD.CoverageID = C.CoverageID
		WHERE 1=1`;

	(params.parentCoverageId) 
		? query += ` AND C.ParentCoverageID = ${params.parentCoverageId}`
		: query += ` AND C.ParentCoverageID = 0`;	
 	
	if(params.insuredId)
		query += ` AND PI.InsuredID = ${params.insuredId}`;

		query += ` GROUP BY 
			C.CoverageID
			,	C.ParentCoverageID
			, C.AgencyID
			, C.AgentID
			, C.EffectiveDate
			, C.ExpirationDate			
			, CT.Name
			, PI.ProjectInsuredID
			, PI.ProjectID
			, PI.InsuredID
			, PI.ComplianceEndDate
			, S.StatusName
			, A.Name
			, CD.DocumentID`;

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

	console.log('generateProjectInsuredCoveragesQuery: ', query);
	return query;
}

exports.generateProjectInsuredCoveragesInsertQuery = (params) => {
	
	let query = `INSERT INTO dbo.ProjectInsureds_Coverages (
		ProjectInsuredID
		, CoverageID
	) VALUES (
		${params.projectInsuredId}
		,${params.coverageId}
	)`;

	return query;
}

exports.generateProjectInsuredCoveragesDeleteQuery = (params) => {

	let query = `DELETE dbo.ProjectInsureds_Coverages 
		WHERE ProjectInsuredID = ${params.projectInsuredId} AND CoverageID = ${params.coverageId}`;

	return query;
}