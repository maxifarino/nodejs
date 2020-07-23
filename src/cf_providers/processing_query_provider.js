exports.generateProcessingQuery = (params) => {	
/*	
	let query = `SELECT 
		CD.CoverageID
		, CD.DocumentID
		, D.FileName
		, C.CoverageTypeID
		, C.ParentCoverageID
		, C.AgencyID
		, C.EffectiveDate
		, C.ExpirationDate
		, C.PolicyNumber
		, CT.Name AS CoverageTypeName
		, CT.Code AS CoverageTypeCode		
		, IC.InsurerID
		, PIC.ProjectInsuredID
		, PI.ProjectID
		, PI.InsuredID
		, RS.Id AS ReqSetID
		, RG.RuleGroupID
		, RG.RuleGroupName
		, HC.Id AS HolderID
		, HC.Name AS HolderName
		, P.Name AS ProjectName
		, SC.Name AS InsuredName
		, SC.Address InsuredAddress
		, SC.City InsuredCity
		, SC.State InsuredState
		, AG.Name AS AgencyName
		, AG.City AS AgencyCity
		, AG.[State] AS AgencyState
		, STRING_AGG(CAST(CONCAT_WS('|', A.AttributeID, A.AttributeName, CA.AttributeValue) AS NVARCHAR(MAX)), ',') AS Attributes	 
		FROM dbo.Coverage_Documents CD
		INNER JOIN dbo.Documents D ON D.DocumentID = CD.DocumentID
		INNER JOIN dbo.Coverages C ON C.CoverageID = CD.CoverageID
		INNER JOIN dbo.ProjectInsureds_Coverages PIC ON PIC.CoverageID = CD.CoverageID
		INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectInsuredID = PIC.ProjectInsuredID
		INNER JOIN dbo.Projects P ON P.Id = PI.ProjectID
		INNER JOIN dbo.SubContractors SC ON SC.Id = PI.InsuredID	
		INNER JOIN dbo.CoverageAttributes CA ON CA.CoverageID = CD.CoverageID
		INNER JOIN dbo.Attributes A ON A.AttributeID = CA.AttributeID
		INNER JOIN dbo.RequirementSets RS ON RS.HolderId = P.HiringClientId
		INNER JOIN dbo.RuleGroups RG ON RG.RequirementSetID = RS.Id AND RG.CoverageTypeID = C.CoverageTypeID
		INNER JOIN dbo.HiringClients HC ON HC.Id = P.HiringClientId
		INNER JOIN dbo.HolderCoveragesTypes HCT ON HCT.HolderID = P.HiringClientId
		INNER JOIN dbo.CoveragesTypes CT ON CT.CoverageTypeID = HCT.CoverageTypeID
		INNER JOIN dbo.Insurers_Coverages IC ON IC.CoverageID = CD.CoverageID  
		INNER JOIN dbo.Agencies AG ON AG.AgencyId = C.AgencyID
	WHERE 1=1`;
*/

	let query = `SELECT
		CD.CoverageID
		, CD.DocumentID
		, D.FileName
		, C.CoverageTypeID
		, C.EffectiveDate
		, C.ExpirationDate
		, C.PolicyNumber
		, C.InsurerID
		, PIC.ProjectInsuredID
		, PI.ProjectID, PI.InsuredID
		, P.Name AS ProjectName
		, SC.Name AS InsuredName
		, SC.Address InsuredAddress
		, SC.City InsuredCity
		, SC.State InsuredState
		, HC.Id AS HolderID
		, HC.Name AS HolderName
		, PRS.RequirementSetID AS ReqSetID
		, RG.RuleGroupID, RG.RuleGroupName
		, CT.Name AS CoverageTypeName, CT.Code AS CoverageTypeCode
		, STRING_AGG(CAST(CONCAT_WS('|', A.AttributeID, A.AttributeName, CA.AttributeValue) AS NVARCHAR(MAX)), ',') AS Attributes
		, AG.Name AS AgencyName
		, AG.City AS AgencyCity
		, AG.State AS AgencyState
		, COI.CertificateId
		, COI.Created AS DateCertificate
		, COI.AgencyId
		, COI.AgentId
		, COI.InsurerIds
		FROM CertificateOfInsurance COI
		INNER JOIN dbo.Coverage_Documents CD ON CD.DocumentID = COI.DocumentId
		INNER JOIN dbo.Documents D ON D.DocumentID = CD.DocumentID
		INNER JOIN dbo.Coverages C ON C.CoverageID = CD.CoverageID
		INNER JOIN dbo.ProjectInsureds_Coverages PIC ON PIC.CoverageID = CD.CoverageID
		INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectInsuredID = PIC.ProjectInsuredID
		INNER JOIN dbo.Projects P ON P.Id = PI.ProjectID
		INNER JOIN dbo.SubContractors SC ON SC.Id = PI.InsuredID	
		INNER JOIN dbo.HiringClients HC ON HC.Id = P.HiringClientId
		INNER JOIN dbo.ProjectRequirementSets PRS ON PRS.ProjectID = PI.ProjectID
		INNER JOIN dbo.RuleGroups RG ON RG.RequirementSetID = PRS.RequirementSetID AND RG.CoverageTypeID = C.CoverageTypeID
		INNER JOIN dbo.CoveragesTypes CT ON CT.CoverageTypeID = RG.CoverageTypeID
		INNER JOIN dbo.CoverageAttributes CA ON CA.CoverageID = C.CoverageID
		INNER JOIN dbo.Attributes A ON A.AttributeID = CA.AttributeID
		INNER JOIN dbo.Agencies AG ON AG.AgencyId = COI.AgencyId
		`;

	if(params.certificateId)
		query += ` WHERE COI.CertificateId = ${params.certificateId}`;	

	query += ` GROUP BY
		CD.CoverageID
		, CD.DocumentID
		, D.FileName
		, C.CoverageTypeID
		, C.EffectiveDate
		, C.ExpirationDate
		, C.PolicyNumber
		, C.InsurerID
		, CT.Name
		, CT.Code
		, PIC.ProjectInsuredID
		, PI.ProjectID
		, PI.InsuredID
		, PRS.RequirementSetID
		, RG.RuleGroupID
		, RG.RuleGroupName
		, HC.Id
		, HC.Name
		, P.Name
		, SC.Name
		, SC.Address
		, SC.City
		, SC.State
		, AG.Name
		, AG.City
		, AG.State
		, COI.CertificateId
		, COI.Created
		, COI.AgencyId
		, COI.AgentId
		, COI.InsurerIds`;	

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}	else {
		query += ` ORDER BY CD.CoverageID `;
	}

	console.log('generateProcessingQuery: ', query);		
	return query;
}

exports.generateProcessingInsurersQuery = (params) => {
	let query =`SELECT 
		I.InsurerID
		, I.InsurerName
		, I.AMBestCompanyNumber
		, I.NAICCompanyNumber
		FROM dbo.Insurers I`;

	if(params.certificateId) {
		query += ` WHERE I.InsurerID IN (
			SELECT InsurerID FROM dbo.Coverages
			WHERE CertificateId = ${params.certificateId}
		)`;
	}	

	console.log('generateProcessingInsurersQuery: ', query);		
	return query;
}

exports.generateProcessingEndorsementsQuery = (params) => {
	let query =`SELECT EndorsementID
		FROM dbo.ProjectInsureds_Endorsements
		WHERE 1=1`;

	if(params.projectInsuredId)
		query += ` AND ProjectInsuredID = ${params.projectInsuredId}`;

	console.log('generateProcessingEndorsementsQuery: ', query);		
	return query;
}


exports.generateProcessingInsertQuery = (params) => {
	/*
	PARAMS (CertificateID, ProjectInsuredID, DocumentID, AgencyID, InsuredID, ProjectInsuredID)
	INSERT Coverages (CoverageTypeID, EffectiveDate, ExpDate, PolicyNumber, CertificateID);
	INSERT Coverage_Documents (DocID, CovID)
	INSERT ProjectInsureds_Coverages (ProjectInsuredID, CovID)
	INSERT CoverageAttributes (AttrID, AttrValue, CovID)
	*/

	let query = `DECLARE @lastInsertedCoverage AS INT;`;
	
	params.coverages.forEach((coverage) => {

		query+=`INSERT INTO dbo.Coverages (
			CoverageTypeID
			, EffectiveDate
			, ExpirationDate
			, PolicyNumber
			, RuleGroupID
			, CertificateID
			, InsurerID
		) VALUES (
			${coverage.coverageTypeId}
			,'${coverage.effectiveDate}'
			,'${coverage.expirationDate}'
			,'${coverage.policy}'
			,${coverage.ruleGroupId}
			,${params.certificateId}
			,${coverage.insurer}
		);`;

		query+=`SET @lastInsertedCoverage = SCOPE_IDENTITY();`;

		query+=`INSERT INTO dbo.Coverage_Documents (
			CoverageID
			, DocumentID
		) VALUES (
			@lastInsertedCoverage
			,${params.documentId}
		);`;

		query+=`INSERT INTO dbo.ProjectInsureds_Coverages (
			CoverageID
			, ProjectInsuredID
			, CertificateID
		) VALUES (
			@lastInsertedCoverage
			,${params.projectInsuredId}
			,${params.certificateId}
		);`;

		// Set ProjectInsured COI
		query+=`INSERT INTO dbo.ProjectInsureds_CertificateOfInsurance (
			ProjectInsuredID
			, CertificateID
		) VALUES (
			${params.projectInsuredId}
			,${params.certificateId}
		);`;

		// Set Top Layer
		query+=`DELETE FROM dbo.Coverages_TopLayers 
			WHERE ProjectInsuredID = ${params.projectInsuredId} 
			AND CoverageTypeID = ${coverage.coverageTypeId};
			INSERT INTO dbo.Coverages_TopLayers (
				CoverageTypeID
				, ProjectInsuredID
				, CertificateID
			) VALUES (
				${coverage.coverageTypeId}
				,${params.projectInsuredId}
				,${params.certificateId}
			);`;

		if (Array.isArray(coverage.attributes)) {
			coverage.attributes.forEach((attr) => {
				if (!attr.value) {
					attr.value = (attr.ConditionTypeID === 1) ? 'UNCHECKED' : '';
				}				
				query+=`INSERT INTO dbo.CoverageAttributes (
					CoverageID
					, AttributeID
					, AttributeValue
					, CoverageAttributeStatusID
				) VALUES (
					@lastInsertedCoverage				
					,${attr.id}
					,'${attr.value}'
					, 3
				);`;
			});
		}
	});

	/** DISABLE ENDORSEMENTS
	params.endorsements.forEach((endorsement) => {
		query+=`INSERT INTO dbo.ProjectInsureds_Endorsements (
			ProjectInsuredID
			, EndorsementID
			, CertificateID
		) VALUES (
			${params.projectInsuredId}
			,${endorsement}
			,${params.certificateId}
		);`;
	});
	*/

	/*
	query+=`SELECT * FROM @Coverages;
		SELECT * FROM @CoverageDocuments;
		SELECT * FROM @ProjectInsuredsCoverages;
		SELECT * FROM @InsurersCoverages;
		SELECT * FROM @CoverageAttributes;`;
	*/
	console.log('generateProcessingInsertQuery: ', query);	
	return query;
}


exports.generateProcessingUpdateQuery = (params) => {	
	/*
	PARAMS (CertificateID, ProjectInsuredID, DocumentID, AgencyID, InsuredID, ProjectInsuredID)
	INSERT Coverages (CoverageTypeID, EffectiveDate, ExpDate, PolicyNumber, CertificateID);
	INSERT Coverage_Documents (DocID, CovID)
	INSERT ProjectInsureds_Coverages (ProjectInsuredID, CovID)
	INSERT CoverageAttributes (AttrID, AttrValue, CovID)
	*/

	// Remove old coverages first
	let query = `DECLARE @rowCount AS INT, @documentId AS INT, @coverage AS INT;
		SELECT @documentId = DocumentId FROM CertificateOfInsurance WHERE CertificateId = ${params.certificateId};
		SELECT @rowCount = COUNT(*) FROM dbo.Coverage_Documents WHERE DocumentID = @documentId;
		WHILE(@rowCount > 0)
		BEGIN
			SELECT @rowCount = @rowCount-1;
			SELECT @coverage = CoverageID FROM dbo.Coverage_Documents WHERE DocumentID = @documentId
			ORDER BY CoverageID DESC OFFSET @rowCount ROWS FETCH NEXT 1 ROWS ONLY;
			IF @coverage IS NOT NULL
			BEGIN
				DELETE FROM dbo.Coverages WHERE CoverageID = @coverage;
				DELETE FROM dbo.ProjectInsureds_Coverages WHERE CoverageID = @coverage;
				DELETE FROM dbo.CoverageAttributes WHERE CoverageID = @coverage;
			END;
		END; `;

	query += `
		DECLARE @lastInsertedCoverage AS INT; `;

	/**	DISABLE ENDORSEMENTS
	query += `
		DELETE FROM dbo.ProjectInsureds_Endorsements 
		WHERE ProjectInsuredID = ${params.projectInsuredId} 
		AND CertificateID = ${params.certificateId}; `;
	*/

	if (params.dateCertificate === undefined) {
		params.dateCertificate = 'getDate()';
	}
	
	query +=`UPDATE dbo.CertificateOfInsurance SET 
			AgencyId = ${Number(params.agencyId)}
		, AgentId = ${(params.agentId) ? Number(params.agentId) : 0}
		, InsurerIds = '${params.insurerIds}';`;

	params.coverages.forEach((coverage) => {

		query+=`INSERT INTO dbo.Coverages (
			CoverageTypeID
			, EffectiveDate
			, ExpirationDate
			, PolicyNumber
			, RuleGroupID
			, CertificateID
			, InsurerID
		) VALUES (
			${coverage.coverageTypeId}
			,'${coverage.effectiveDate}'
			,'${coverage.expirationDate}'
			,'${coverage.policy}'
			,${coverage.ruleGroupId}
			,${params.certificateId}
			,${coverage.insurer}
		);`;

		query+=`SET @lastInsertedCoverage = SCOPE_IDENTITY();`;

		query+=`INSERT INTO dbo.Coverage_Documents (
			CoverageID
			, DocumentID
		) VALUES (
			@lastInsertedCoverage
			,${params.documentId}
		);`;

		query+=`INSERT INTO dbo.ProjectInsureds_Coverages (
			CoverageID
			, ProjectInsuredID
			, CertificateID
		) VALUES (
			@lastInsertedCoverage
			,${params.projectInsuredId}
			,${params.certificateId}
		);`;
		
		// Set ProjectInsured COI
		query+=`INSERT INTO dbo.ProjectInsureds_CertificateOfInsurance (
			ProjectInsuredID
			, CertificateID
		) VALUES (
			${params.projectInsuredId}
			,${params.certificateId}
		);`;

		// Set Top Layer
		query+=`DELETE FROM dbo.Coverages_TopLayers 
			WHERE ProjectInsuredID = ${params.projectInsuredId} 
			AND CoverageTypeID = ${coverage.coverageTypeId};
			INSERT INTO dbo.Coverages_TopLayers (
				CoverageTypeID
				, ProjectInsuredID
				, CertificateID
			) VALUES (
				${coverage.coverageTypeId}
				,${params.projectInsuredId}
				,${params.certificateId}
			);`;

		if (Array.isArray(coverage.attributes)) {
			coverage.attributes.forEach((attr) => {
				if (!attr.value) {
					attr.value = (attr.ConditionTypeID === 1) ? 'UNCHECKED' : '';
				}
				query+=`INSERT INTO dbo.CoverageAttributes (
					CoverageID
					, AttributeID
					, AttributeValue
					, CoverageAttributeStatusID
				) VALUES (
					@lastInsertedCoverage				
					,${attr.id}
					,'${attr.value}'
					, 3
				);`;
			});
		}
	});

	/** DISABLE ENDORSEMENTS
	params.endorsements.forEach((endorsement) => {
		query+=`INSERT INTO dbo.ProjectInsureds_Endorsements (
			ProjectInsuredID
			, EndorsementID
			, CertificateID
		) VALUES (
			${params.projectInsuredId}
			,${endorsement}
			,${params.certificateId}
		);`;
	});
	*/

	/*
	query+=`SELECT * FROM @Coverages;
		SELECT * FROM @CoverageDocuments;
		SELECT * FROM @ProjectInsuredsCoverages;
		SELECT * FROM @InsurersCoverages;
		SELECT * FROM @CoverageAttributes;`;
	*/
	console.log('generateProcessingUpdateQuery: ', query);	
	return query;
}


exports.generateCoveragesComparisonQuery = (params) => {

	let query =`SELECT 
			C.CoverageID
			, C.EffectiveDate
			, C.ExpirationDate
			, CA.CoverageAttributeID
			, C.RuleGroupID
			, R.RuleID
			, CA.AttributeID
			, A.AttributeName
			, CA.AttributeValue
			, R.ConditionTypeID
			, R.ConditionValue
			, PI.ProjectInsuredId
			, C.InsurerID 
		FROM Coverages C
		LEFT JOIN CoverageAttributes CA ON CA.CoverageId = C.CoverageId
		LEFT JOIN Attributes A ON CA.AttributeID = A.AttributeID 
		LEFT JOIN Rules R on R.RuleGroupID=C.RuleGroupID AND CA.AttributeID = R.AttributeID
		LEFT JOIN CertificateOfInsurance COI ON COI.CertificateId = C.CertificateID
		LEFT JOIN ProjectsInsureds PI ON PI.ProjectID = COI.ProjectID AND PI.InsuredId = COI.InsuredId
	WHERE C.CertificateID = ${params.certificateId}
	ORDER BY C.CoverageID ASC, CA.CoverageAttributeID ASC
	`;	

//console.log(query);		
	return query;
}

exports.generateRulesComparisonQuery = (params) => {

	let query =`SELECT
		RS.Id AS RequirementSetID
		, RG.RuleGroupID
		, R.RuleID
		, R.ConditionTypeID
		, R.ConditionValue
		, R.DeficiencyText
		, R.DeficiencyTypeID
		, ATR.AttributeID
		, ATR.AttributeName
		, RG.CoverageTypeID
		, CT.Name as CoverageTypeName
		FROM dbo.RequirementSets RS
		INNER JOIN dbo.RuleGroups RG ON RG.RequirementSetID = RS.Id
		INNER JOIN dbo.Rules R ON R.RuleGroupID = RG.RuleGroupID
		INNER JOIN dbo.ProjectRequirementSets PRS ON PRS.RequirementSetID = RS.id
		INNER JOIN dbo.Attributes ATR ON ATR.AttributeID = R.AttributeID
		INNER JOIN CoveragesTypes CT ON CT.CoverageTypeID = RG.CoverageTypeID

		WHERE 1=1`;

	if(params.holderId)
		query += ` AND RS.HolderId = ${params.holderId}`;	
	if(params.projectId)
		query += ` AND PRS.ProjectId = ${params.projectId}`;	

	console.log(query);
	return query;
}

exports.generateDeficiencyDeleteQuery = (params) => {
	console.log('params', params);
	let query =`DELETE FROM dbo.ProjectInsuredDeficiencies WHERE `;
	let where = [];
	if(params.certificateId || params.certificateId == 0) where.push(`CertificateID = ${params.certificateId}`);	
	if(params.projectInsuredId) where.push(`ProjectInsuredID = ${params.projectInsuredId}`);	
	if(params.ruleGroupId) where.push(`RuleGroupID = ${params.ruleGroupId}`);	
	if(params.ruleId) where.push(`RuleID = ${params.ruleId}`);	

	query += (where.length && ` ${where.join(' AND ')}`) + ';';
	
	console.log('generateDeficiencyDeleteQuery', query);
	return query;
}

exports.generateDeficiencySelectQuery = (params) => {
	console.log('params', params);
	let query =`SELECT * FROM dbo.ProjectInsuredDeficiencies WHERE`;
	let where = [];
	if(params.certificateId === 0 || params.certificateId) where.push(`CertificateID = ${params.certificateId}`);	
	if(params.projectInsuredId) where.push(`ProjectInsuredID = ${params.projectInsuredId}`);	

	query += (where.length && ` ${where.join(' AND ')}`) + ';';

	console.log('query', query);
	return query;
}

exports.generateDeficiencyRulesInsertQuery = (params) => {

	let query =`INSERT INTO dbo.ProjectInsuredDeficiencies (
		DeficiencyText
		, DeficiencyTypeID
		, DeficiencyStatusID
		, ProjectInsuredID
		, RuleID
		, CertificateId
		, CreatedDate
		, RuleGroupId
	) VALUES (
		'${params.deficiencyText}'
		,${params.deficiencyTypeId}
		,${params.deficiencyStatusId}
		,${params.projectInsuredId}
		,${params.ruleId}
		,${params.certificateId}
		,getDate()
		,${params.ruleGroupId}
	);`;

	// console.log('QUERY', query);		
	return query;
}


exports.generateDeficiencyViewerQuery = (params) => {	
/*	
	let query = `SELECT
		PID.ProjectInsuredDeficiencyID
		, PID.DeficiencyText
		, PID.DeficiencyTypeID
		, PID.DeficiencyStatusID
		, PID.ProjectInsuredID
		, PID.RuleID
		, PID.CreatedDate
		, PID.ModifiedDate
		, PID.ModifiedByID
		, RG.RuleGroupName
		, CD.CoverageID
		, CD.DocumentID
		, D.FileName
		, RS.HolderID
		, HC.Name AS HolderName
		, PI.ProjectID
		, P.Name AS ProjectName
		, RS.Id AS ReqSetId
		FROM dbo.ProjectInsuredDeficiencies PID
	INNER JOIN dbo.Rules R ON R.RuleID = PID.RuleID
	INNER JOIN dbo.RuleGroups RG ON RG.RuleGroupID = R.RuleGroupID
	INNER JOIN dbo.Coverages C ON C.RuleGroupID = RG.RuleGroupID
	INNER JOIN dbo.Coverage_Documents CD ON CD.CoverageID = C.CoverageID
	INNER JOIN dbo.Documents D ON D.DocumentID = CD.DocumentID
	INNER JOIN dbo.RequirementSets RS ON RS.Id = RG.RequirementSetID
	INNER JOIN dbo.HiringClients HC ON HC.Id = RS.HolderId
	INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectInsuredID = PID.ProjectInsuredID
	INNER JOIN dbo.Projects P ON P.Id = PI.ProjectID
	WHERE 1=1`;
	 
	if(params.documentId)
		query += ` AND CD.DocumentID = ${params.documentId}`;	

	query += ` GROUP BY
		PID.ProjectInsuredDeficiencyID
		, PID.DeficiencyText
		, PID.DeficiencyTypeID
		, PID.DeficiencyStatusID
		, PID.ProjectInsuredID
		, PID.RuleID
		, PID.CreatedDate
		, PID.ModifiedDate
		, PID.ModifiedByID
		, RG.RuleGroupName
		, CD.CoverageID
		, CD.DocumentID
		, D.FileName
		, RS.HolderID
		, HC.Name
		, PI.ProjectID
		, P.Name
		, RS.Id`;	
*/
	let query = `
	SELECT
		PID.ProjectInsuredDeficiencyID
		, PID.DeficiencyText
		, PID.DeficiencyTypeID
		, PID.DeficiencyStatusID
		, PID.ProjectInsuredID
		, PID.RuleID
		, PID.CreatedDate
		, PID.ModifiedDate
		, PID.ModifiedByID
		, RG.RuleGroupName
		, D.FileName
		, COI.HolderID
		, HC.Name AS HolderName
		, COI.ProjectID
		, P.Name AS ProjectName

	FROM dbo.ProjectInsuredDeficiencies PID
	LEFT JOIN dbo.CertificateOfInsurance COI ON COI.CertificateId = PID.CertificateId
	LEFT JOIN dbo.Rules R ON R.RuleID = PID.RuleID
	LEFT JOIN dbo.RuleGroups RG ON RG.RuleGroupID = R.RuleGroupID
	LEFT JOIN dbo.Documents D ON D.DocumentID = COI.DocumentID
	LEFT JOIN dbo.HiringClients HC ON HC.id = COI.HolderId
	LEFT JOIN dbo.Projects P ON P.id = COI.ProjectId
	WHERE 1=1
	`;

	if(params.documentId)
		query += ` AND COI.DocumentID = ${params.documentId}`;	

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}	else {
		query += ` ORDER BY RG.RuleGroupName `;
	}

	console.log('QUERY:', query);
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

	console.log('QUERY', query);
	return query;
}

exports.generateEndorsementsComparisonQuery = (params) => {

	let query =`SELECT
		RS.Id AS RequirementSetID,
		RSE.EndorsementID,
		E.Name
		FROM dbo.RequirementSets RS
		INNER JOIN dbo.ProjectRequirementSets PRS ON PRS.RequirementSetID = RS.id
		INNER JOIN dbo.RequirementSets_Endorsements RSE ON RSE.RequirementSetID = RS.Id
		INNER JOIN dbo.Endorsements E ON E.id = RSE.EndorsementID
		WHERE 1=1`;

	if(params.holderId)
		query += ` AND RS.HolderId = ${params.holderId}`;	
	if(params.projectId)
		query += ` AND PRS.ProjectId = ${params.projectId}`;	

	console.log(query);
	return query;
}

exports.generateCoveragesEndorsementsComparisonQuery = (params) => {

	let query =`SELECT 
		PIE.EndorsementID,
		PRS.RequirementSetID
		FROM dbo.ProjectInsureds_Endorsements PIE
		INNER JOIN dbo.ProjectsInsureds PIs ON PIE.ProjectInsuredID = PIS.ProjectInsuredID
		INNER JOIN dbo.ProjectRequirementSets PRS ON PRS.ProjectId = PIS.ProjectId
		WHERE 1=1`;
		query += ` AND PIE.CertificateId = ${params.certificateId}`;	

	console.log(query);		
	return query;
}

exports.generateDeficiencyEndorsementsInsertQuery = (params) => {
	console.log('PARAMS', params);		

	let query =`INSERT INTO dbo.ProjectInsuredDeficiencies (
		DeficiencyText
		, DeficiencyTypeID
		, DeficiencyStatusID
		, ProjectInsuredID
		, EndorsementID
		, CertificateId
		, CreatedDate
	) VALUES (
		'${params.deficiencyText}'
		,${params.deficiencyTypeId}
		,${params.deficiencyStatusId}
		,${params.projectInsuredId}
		,${params.endorsementID}
		,${params.certificateId}
		,getDate()
	)`;

	console.log('QUERY', query);		
	return query;
}


/**
 * COI
 */ 
exports.generateCertificateOfInsuranceQuery = (params) => {
	let query = `SELECT 
		COI.CertificateId
		, COI.DocumentId
		, COI.Created
		, COI.MasterCertificate
		, COI.HolderId
		, COI.ProjectId
		, COI.InsuredId
		, COI.AgencyId
		, COI.AgentId
		, COI.InsurerIds
		, D.[FileName]
		, HC.Name AS HolderName
		, P.Name AS ProjectName
		, SC.Name AS InsuredName
		, PI.ProjectInsuredID AS ProjectInsuredId
		FROM dbo.CertificateOfInsurance COI
		INNER JOIN dbo.Documents D ON D.DocumentID = COI.DocumentId
		INNER JOIN dbo.HiringClients HC ON HC.Id = COI.HolderId
		INNER JOIN dbo.Projects P ON P.Id = COI.ProjectId
		INNER JOIN dbo.SubContractors SC ON SC.Id = COI.InsuredId
		INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectID = P.Id AND PI.InsuredID = SC.Id
		WHERE 1=1`;
	
	if(params.certificateId) {
		query += ` AND COI.CertificateId = ${params.certificateId}`;		
	}
	console.log('generateCertificateOfInsuranceQuery: : ', query);		
	return query;
}

exports.generateCertificateOfInsuranceInsertQuery = (params) => {
	if (params.dateCertificate === undefined) {
		params.dateCertificate = 'getDate()';
	}

	let	query =`INSERT INTO dbo.CertificateOfInsurance (
		DocumentId
		, Created
		, MasterCertificate
		, HolderId
		, ProjectId
		, InsuredId
		, AgencyId
		, AgentId
		, InsurerIds
	) VALUES (
		${params.documentId}
		,${params.dateCertificate}
		,${Number(params.masterCertificate) || 0}
		,${Number(params.holderId)}
		,${Number(params.projectId)}
		,${Number(params.insuredId)}
		,${Number(params.agencyId) || 0}
		,${Number(params.agentId) || 0}
		,${params.insurerIds || null}
	);`;
	console.log('generateCertificateInsertQuery: ', query);	
	return query;
}

exports.generateCertificateOfInsuranceUpdateQuery = (params) => {
	let	query =`UPDATE dbo.CertificateOfInsurance SET `;

	if(params.documentId)
    query += `DocumentId = ${params.documentId},`;

	if(params.holderId)
    query += `HolderId = ${params.holderId},`;
    
	if(params.projectId)
		query += `ProjectId = ${params.projectId},`;

	if(params.insuredId)
		query += `InsuredId = ${params.insuredId},`;	

  // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE CertificateId = ${params.certificateId}`;

	console.log('generateCertificateUpdateQuery: ', query);	
	return query;
}