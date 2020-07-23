exports.generateInsuredsQuery = (params) => {	
	let query = `SELECT
		SC.Id
		, SC.Name
		, SC.State  
		, PI.ComplianceStatusID
		, PICS.StatusName AS Status
		, P.Id AS ProjectId
		, P.Name AS Project
		, HC.Id AS HolderId
		, HC.Name AS Holder
		, STRING_AGG(CAST(CT.[Code] AS NVARCHAR(MAX)), ',') WITHIN GROUP (ORDER BY CT.Code) AS Coverage
		FROM dbo.SubContractors SC 
		INNER JOIN dbo.ProjectsInsureds PI ON PI.InsuredID = SC.Id
		INNER JOIN dbo.ProjectInsured_ComplianceStatus PICS ON PICS.ProjectInsuredComplianceStatusID = PI.ComplianceStatusID
		INNER JOIN dbo.Projects P ON P.Id = PI.ProjectID
		INNER JOIN dbo.HiringClients HC ON HC.Id = P.HiringClientId
		INNER JOIN dbo.HolderCoveragesTypes HCT ON HCT.HolderID = HC.Id
		INNER JOIN dbo.CoveragesTypes CT ON CT.CoverageTypeID = HCT.CoverageTypeID`;

	if(params.tierRating)
		query +=` INNER JOIN dbo.TierRatingsCriterias TRC ON TRC.HiringClientId = HCS.HiringClientId`;
		
	if(params.expirationStartDate || params.expirationEndDate || params.insurer) {
		query +=` INNER JOIN dbo.RequirementSets RS ON RS.HolderId = HC.Id
			INNER JOIN dbo.RuleGroups RG ON RG.RequirementSetID = RS.Id
			INNER JOIN dbo.Coverages C ON C.RuleGroupID = RG.RuleGroupID
			INNER JOIN dbo.HolderCoveragesTypes HCT2 ON HCT2.HolderID = RS.HolderID`;

		if(params.insurer) {
			query +=` INNER JOIN dbo.Insurers_Coverages IC ON IC.CoverageID = C.CoverageID
				INNER JOIN dbo.Insurers I ON I.InsurerID = IC.InsurerID`;
		}
	}

	query +=`	WHERE 1=1`;
	
	// FILTERS
	if(params.keyword) {
		query += ` AND (SC.Name LIKE '%${params.keyword}%' OR
										HC.Name LIKE '%${params.keyword}%' OR
										P.Name LIKE '%${params.keyword}%' OR
										SC.State LIKE '%${params.keyword}%')`;
	}									

	if(params.holderId)
		query += ` AND HC.Id = ${params.holderId}`;
	if(params.projectId)
		query += ` AND P.Id = ${params.projectId}`;
	if(params.insuredId)
		query += ` AND SC.Id = ${params.insuredId}`;
	if(params.state)
		query += ` AND SC.State LIKE '%${params.state}%'`;	
	if(params.coverageType)
		query += ` AND CT.Code = '${params.coverageType}'`;	
	if(params.compliance)
		query += ` AND PI.ComplianceStatusID = ${params.compliance}`;
	if(params.tierRating)
		query += ` AND TRC.Tier = ${params.tierRating}`;
	if (params.customerUniqueId)
		query += ` AND PI.CustomerUniqueId = ${params.customerUniqueId}`;	
	if(params.expirationStartDate)
		query += ` AND C.EffectiveDate  >= '${params.expirationStartDate}'`;
	if(params.expirationEndDate)
		query += ` AND C.ExpirationDate <= '${params.expirationEndDate}'`;
	if(params.insurer)
		query += ` AND I.InsurerName LIKE '%${params.insurer}%'`;	
		
	// GROUP BY (used for coverage list)
	query += ` GROUP BY 
		SC.Id
		, SC.Name
		, SC.State  
		, PI.ComplianceStatusID
		, PICS.StatusName
		, P.Id
		, P.Name
		, HC.Id
		, HC.Name`;

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

	console.log('generateInsuredsQuery: ', query);
	return query;
}


exports.generateProjectsQuery = (params) => {
	let query = `SELECT 
		P.Id
		, P.Name
		, P.HiringClientId
		, P.City
		, P.State
		, STRING_AGG(CAST(HC.[Name] AS NVARCHAR(MAX)), ',') WITHIN GROUP (ORDER BY HC.Name) AS Holder
		, SUM(CASE WHEN PI.ComplianceStatusID = 1 THEN 1 ELSE 0 END) AS Req 
		, SUM(CASE WHEN PI.ComplianceStatusID = 2 THEN 1 ELSE 0 END) AS Acc
		, SUM(CASE WHEN PI.ComplianceStatusID = 3 THEN 1 ELSE 0 END) AS Exp
		, SUM(CASE WHEN PI.ComplianceStatusID = 4 THEN 1 ELSE 0 END) AS Pnd
		, SUM(CASE WHEN PI.ComplianceStatusID = 5 THEN 1 ELSE 0 END) AS Rej
		, SUM(CASE WHEN PI.ComplianceStatusID = 6 THEN 1 ELSE 0 END) AS Rev
		FROM dbo.Projects P
		INNER JOIN dbo.HiringClients HC ON HC.Id = P.HiringClientId
		INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectID = P.Id
		LEFT JOIN dbo.HolderCoveragesTypes HCT ON HCT.HolderID = P.HiringClientId
		LEFT JOIN dbo.CoveragesTypes CT ON CT.CoverageTypeID = HCT.CoverageTypeID`;

	if(params.insuredId) {
		query +=` INNER JOIN dbo.SubContractors SC ON SC.Id = PI.InsuredID`; 
	}
	
	if(params.tierRating)
		query +=` INNER JOIN dbo.TierRatingsCriterias TRC ON TRC.HiringClientId = P.HiringClientId`;
	
	if(params.expirationStartDate || params.expirationEndDate || params.insurer) {
		query +=` INNER JOIN dbo.RequirementSets RS ON RS.HolderId = HC.Id
			INNER JOIN dbo.RuleGroups RG ON RG.RequirementSetID = RS.Id
			INNER JOIN dbo.Coverages C ON C.RuleGroupID = RG.RuleGroupID
			INNER JOIN dbo.HolderCoveragesTypes HCT2 ON HCT2.HolderID = RS.HolderID`;

		if(params.insurer) {
			query +=` INNER JOIN dbo.Insurers_Coverages IC ON IC.CoverageID = C.CoverageID
				INNER JOIN dbo.Insurers I ON I.InsurerID = IC.InsurerID`;
		}
	}

	query += ` WHERE 1=1`;	
	
	// FILTERS
	if(params.keyword) {
		query += ` AND (P.Name LIKE '%${params.keyword}%' OR
										HC.Name LIKE '%${params.keyword}%' OR
										P.City LIKE '%${params.keyword}%' OR
										P.State LIKE '%${params.keyword}%')`;
	}

	if(params.holderId)
		query += ` AND HC.Id = ${params.holderId}`;
	if(params.projectId)
		query += ` AND P.Id = ${params.projectId}`;
	if(params.insuredId)
		query += ` AND SC.Id = ${params.insuredId}`;
	if(params.state)
		query += ` AND P.State LIKE '%${params.state}%'`;
	if(params.tierRating)
		query += ` AND TRC.Tier = ${params.tierRating}`;	
	if(params.compliance)
		query += ` AND PI.ComplianceStatusID = ${params.compliance}`;	
	if(params.coverageType)
		query += ` AND CT.Code = '${params.coverageType}'`;	
	if (params.customerUniqueId)
		query += ` AND PI.CustomerUniqueId = ${params.customerUniqueId}`;	
	if(! params.archived)
		query += ` AND HCT.Archived = 0`;
	if(params.expirationStartDate)
		query += ` AND C.EffectiveDate  >= '${params.expirationStartDate}'`;
	if(params.expirationEndDate)
		query += ` AND C.ExpirationDate <= '${params.expirationEndDate}'`;
	if(params.insurer)
		query += ` AND I.InsurerName LIKE '%${params.insurer}%'`;	

	// GROUP BY (used for holder list)
	query += ` GROUP BY 
		P.Id
		, P.Name
		, P.HiringClientId
		, P.City
		, P.State`;

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

	console.log('generateProjectsQuery: ', query);
	return query;
}


exports.generateHoldersQuery = (params) => {
	let query = `WITH Rec AS
		(
			SELECT 
				HC.Id
				, HC.Name
				, HC.ParentHiringClientId AS ParentHolder
				, HC.City
				, HC.State
				, CAST(HC.Id AS VarChar(Max)) as TopHolder
			FROM dbo.HiringClients HC
			WHERE HC.ParentHiringClientId IS NULL
			
			UNION ALL
		
			SELECT 
				HC1.Id
				, HC1.Name
				, HC1.ParentHiringClientId AS ParentHolder
				, HC1.City
				, HC1.State, CAST(HC1.Id AS VarChar(Max)) + ' > ' + R.TopHolder
			FROM dbo.HiringClients HC1			
			INNER JOIN Rec R ON R.Id = HC1.ParentHiringClientId
		)
		SELECT 
			R.Id
			, R.Name
			, R.ParentHolder
			, R.City
			, R.State
			, R.TopHolder
		FROM Rec R 
		LEFT JOIN dbo.Projects P ON P.HiringClientId = R.Id
		LEFT JOIN dbo.HolderCoveragesTypes HCT ON HCT.HolderID = R.Id
		LEFT JOIN dbo.CoveragesTypes CT ON CT.CoverageTypeID = HCT.CoverageTypeID`;

		if(params.insured || params.compliance || params.customerUniqueId) {
			query +=` INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectID = P.Id
								INNER JOIN dbo.SubContractors SC ON SC.Id = PI.InsuredID`; 
		}

		if(params.tierRating)
			query +=` INNER JOIN dbo.TierRatingsCriterias TRC ON TRC.HiringClientId = R.Id`;

		if(params.expirationStartDate || params.expirationEndDate || params.insurer) {
			query +=` INNER JOIN dbo.RequirementSets RS ON RS.HolderId = R.Id
				INNER JOIN dbo.RuleGroups RG ON RG.RequirementSetID = RS.Id
				INNER JOIN dbo.Coverages C ON C.RuleGroupID = RG.RuleGroupID
				INNER JOIN dbo.HolderCoveragesTypes HCT2 ON HCT2.HolderID = RS.HolderID`;
	
			if(params.insurer) {
				query +=` INNER JOIN dbo.Insurers_Coverages IC ON IC.CoverageID = C.CoverageID
					INNER JOIN dbo.Insurers I ON I.InsurerID = IC.InsurerID`;
			}
		}

		query +=`	WHERE 1=1`;			

	// FILTERS
	if(params.keyword)
		query += ` AND R.Name LIKE '%${params.keyword}%'`;
	if(params.holderId)
		query += ` AND R.Id = ${params.holderId}`;
	if(params.projectId)
		query += ` AND P.Id = ${params.projectId}`;
	if(params.insuredId)
		query += ` AND SC.Id = ${params.insuredId}`;
	if(params.city)
		query += ` AND R.City LIKE '%${params.city}%'`;
	if(params.state)
		query += ` AND R.State LIKE '%${params.state}%'`;
	if(params.tierRating)
		query += ` AND TRC.Tier = ${params.tierRating}`;
	if(params.compliance)
		query += ` AND PI.ComplianceStatusID = ${params.compliance}`;
	if(params.coverageType)
		query += ` AND CT.Code = '${params.coverageType}'`;	
	if (params.customerUniqueId)
		query += ` AND PI.CustomerUniqueId = ${params.customerUniqueId}`;
	if(! params.archived)
		query += ` AND HCT.Archived = 0`;
	if(params.expirationStartDate)
		query += ` AND C.EffectiveDate  >= '${params.expirationStartDate}'`;
	if(params.expirationEndDate)
		query += ` AND C.ExpirationDate <= '${params.expirationEndDate}'`;
	if(params.insurer)
		query += ` AND I.InsurerName LIKE '%${params.insurer}%'`;		

	// GROUP BY (used for holder list)
	query += ` GROUP BY 
		R.Id
		, R.Name
		, R.ParentHolder
		, R.City
		, R.State
		, R.TopHolder`;
			
	if(params.orderBy) {
		query += ` ORDER BY R.${params.orderBy}`;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}

	if(params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
	}

	console.log('generateHoldersQuery: ', query);
	return query;
}


exports.generateContactsQuery = (params) => {
	let contactsQueryCondition = `WHERE 1=1`,
		agenciesQueryCondition = `WHERE 1=1`;
	
	// FILTERS
	if(params.keyword) {
		contactsQueryCondition += ` AND (C.FirstName LIKE '%${params.keyword}%' OR C.LastName LIKE '%${params.keyword}%' OR 
			C.PhoneNumber LIKE '%${params.keyword}%' OR C.EmailAddress LIKE '%${params.keyword}%') `;
		agenciesQueryCondition += ` AND (A.FirstName LIKE '%${params.keyword}%' OR A.LastName LIKE '%${params.keyword}%' OR
			A.PhoneNumber LIKE '%${params.keyword}%' OR A.EmailAddress LIKE '%${params.keyword}%') `;
	}

	if(params.holderId) {
		contactsQueryCondition += ` AND HC1.Id = ${params.holderId}`;
		agenciesQueryCondition += ` AND HC1.Id = ${params.holderId}`;
	}
	if(params.projectId) {
		contactsQueryCondition += ` AND P.Id  = ${params.projectId}`;
		agenciesQueryCondition += ` AND P.Id = ${params.projectId}`;
	}		
	if(params.insuredId) {

	}

	let query = `SELECT 
		C.ContactID
		, C.FirstName
		, C.LastName
		, C.PhoneNumber
		, C.MobileNumber
		, C.EmailAddress
		, CASE
				WHEN C.TypeId = 1 THEN SC.Name
				WHEN C.TypeId = 3 THEN HC1.Name
			END AS Entity
		,	CT.Description AS ContactType
		FROM dbo.Contacts C
		LEFT JOIN dbo.ContactsTypes CT ON CT.Id = C.TypeId
		LEFT JOIN dbo.InsuredContacts IC ON IC.ContactID = C.ContactID
		LEFT JOIN dbo.SubContractors SC ON SC.Id = IC.InsuredID
		LEFT JOIN dbo.HolderContacts HC ON HC.ContactID = C.ContactID
		LEFT JOIN dbo.HiringClients HC1 ON HC1.Id = HC.HolderId
		LEFT JOIN dbo.Projects P ON P.HiringClientId = HC.HolderId
		${contactsQueryCondition}
	UNION
		SELECT 
		A.AgentID
		, A.FirstName
		, A.LastName
		, A.PhoneNumber
		, A.MobileNumber
		, A.EmailAddress
		, AC.Name AS Entity
		, CT.Description AS ContactType
		FROM dbo.Agents A
		INNER JOIN dbo.ContactsTypes CT ON CT.Id = 2
		INNER JOIN dbo.Agencies AC ON AC.AgencyId = A.AgencyId
		LEFT JOIN dbo.Coverages C ON (C.AgencyId = AC.AgencyId OR C.AgentId = A.AgentID)
		LEFT JOIN dbo.HolderCoveragesTypes HCT ON HCT.CoverageTypeID = C.CoverageTypeID
		LEFT JOIN dbo.HiringClients HC1 ON HC1.Id = HCT.HolderId
		LEFT JOIN dbo.Projects P ON P.HiringClientId = HC1.Id
		${agenciesQueryCondition}`;			
	
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

	console.log('generateContactsQuery: ', query);
	return query;
}


exports.generateAgenciesQuery = (params) => {
	let query = `SELECT DISTINCT
		A.AgencyId
		, A.Name
		, A.City
		, A.State
		FROM dbo.Agencies A    
		INNER JOIN Coverages C ON C.AgencyId = A.AgencyId
		INNER JOIN HolderCoveragesTypes HCT ON HCT.CoverageTypeID = C.CoverageTypeID
		INNER JOIN HiringClients HC ON HC.Id = HCT.HolderID
		WHERE 1=1`;	
	
	// FILTERS
	if(params.keyword) {
		query += ` AND (A.Name LIKE '%${params.keyword}%' OR
										A.City LIKE '%${params.keyword}%' OR
										A.State LIKE '%${params.keyword}%')`;
	}
	if(params.city)
		query += ` AND A.City LIKE '%${params.city}%'`;
	if(params.state)
		query += ` AND A.State LIKE '%${params.state}%'`;	
	if(params.holderId)
		query += ` AND HC.Id = ${params.holderId}`;

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

	console.log('generateAgenciesQuery: ', query);
	return query;
}