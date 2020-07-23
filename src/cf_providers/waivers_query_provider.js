exports.generateWaiversQuery = (params) => {

	let query = `SELECT * FROM dbo.Waivers WHERE 1=1`;

	if (params.waiverId)
		query += ` AND WaiverID = ${params.waiverId}`;
	if (params.waiverDate)
		query += ` AND WaiverDate = ${params.waiverDate}`;
	if (params.projectInsuredId)
		query += ` AND ProjectInsuredID = ${params.projectInsuredId}`;
	if (params.waiverCreatedById)
		query += ` AND WaiverCreatedByID = ${params.waiverCreatedById}`;
	if (params.waiverSentToId)
		query += ` AND WaiverSentToID = ${params.waiverSentToId}`;
	if (params.completedFlag)
		query += ` AND CompletedFlag = ${params.completedFlag}`;

	if (params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;

		if (params.orderDirection) {
			query += ` ${params.orderDirection} `;
		}
	}

	if (params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;
	}

	//console.log('QUERY', query);
	return query;
}

exports.generateWaiversInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Waivers (
		WaiverDate
		, ProjectInsuredID
		, WaiverCreatedByID `;

	if (params.waiverSentToID)
		query += `, WaiverSentToID`;
	if (params.completedFlag)
		query += `, CompletedFlag`;

	query += `) VALUES (
		getDate()
		,${params.projectInsuredId}
		,${params.waiverCreatedById} `;

	if (params.waiverSentToId)
		query += `,${params.waiverSentToId}`;
	if (params.completedFlag)
		query += `,${params.completedFlag}`;

	query += `)`;

	console.log('QUERY', query);
	return query;
}

exports.generateWaiversDeleteQuery = (params) => {

	let query = `DELETE dbo.Waivers WHERE WaiverId = ${params.waiverId}`;

	return query;
}

exports.generateWaiversDetailQuery = (params) => {

	let query = `
	SELECT
			W.WaiverID
		, W.WaiverDate
		, W.WaiverCreatedByID
		, W.ProjectInsuredID
		, WLI.WaiverStatusID
		, WLI.ProjectInsuredDeficiencyID
		, WLI.ActionDate
		, WLI.ActionByID
		, PID.DeficiencyText
		, PID.RuleID
		, R.DeficiencyText AS RuleDeficiencyText
		, RG.RequirementSetID
		, RG.RuleGroupID
		, RG.RuleGroupName
		, CT.CoverageTypeID
		, CASE WHEN CT.Name IS NULL THEN '[Endorsement]' ELSE CT.Name END AS CoverageTypeName
		, CT.DeficiencyCode
		, CT.DeficiencyMessage
		, U.FirstName
		, U.LastName
		, U2.FirstName AS ActionByFirstName
		, U2.LastName AS ActionByLastName
		FROM dbo.Waivers W
		INNER JOIN dbo.WaiverLineItems WLI ON WLI.WaiverID = W.WaiverID
		INNER JOIN dbo.ProjectInsuredDeficiencies PID ON PID.ProjectInsuredDeficiencyID = WLI.ProjectInsuredDeficiencyID
		LEFT JOIN dbo.Rules R ON R.RuleID = PID.RuleID
		LEFT JOIN dbo.RuleGroups RG ON RG.RuleGroupID = R.RuleGroupID
		LEFT JOIN dbo.CoveragesTypes CT ON CT.CoverageTypeID = RG.CoverageTypeID
		INNER JOIN dbo.Users U ON U.Id = W.WaiverCreatedByID
		LEFT JOIN dbo.Users U2 ON U2.Id = WLI.ActionByID
		WHERE 1=1`;

	if (params.searchTerm)
		query += `  AND (PID.DeficiencyText LIKE '%${params.searchTerm}%' OR
										CT.Name LIKE '%${params.searchTerm}%' OR
										U.FirstName LIKE '%${params.searchTerm}%' OR
										U.LastName LIKE '%${params.searchTerm}%') `;

	if (params.waiverId)
		query += ` AND W.WaiverID = ${params.waiverId}`;
	if (params.waiverStatusId)
		query += ` AND WLI.WaiverStatusID = ${params.waiverStatusId}`;
	if (params.waiverDate)
		query += ` AND W.WaiverDate = '${params.waiverDate}'`;
	if (params.projectInsuredId)
		query += ` AND W.ProjectInsuredID = ${params.projectInsuredId}`;
	if (params.waiverCreatedById)
		query += ` AND W.WaiverCreatedByID = ${params.waiverCreatedById}`;
	if (params.waiverSentToId)
		query += ` AND W.WaiverSentToID = ${params.waiverSentToId}`;
	if (params.completedFlag)
		query += ` AND W.CompletedFlag = ${params.completedFlag}`;

	if (params.insuredId)
		query += ` AND W.ProjectInsuredID = ${params.insuredId}`;

	if (params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;

		if (params.orderDirection) {
			query += ` ${params.orderDirection} `;
		}
	}

	if (params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;
	}

	console.log('QUERY', query);
	return query;
}


