exports.generateProjectCertTextsQuery = (params) => {
	
	let query = `SELECT *	FROM dbo.ProjectCertTexts
		WHERE 1=1`;
 	
	if(params.projectId)
		query += ` AND ProjectID = ${params.projectId}`;
	if(params.header)
		query += ` AND Header LIKE '%${params.header}%'`;
	if(params.cancellationNotice)
		query += ` AND CancellationNotice LIKE '%${params.cancellationNotice}%'`;	
	if(params.disclaimer)
		query += ` AND Disclaimer LIKE '%${params.disclaimer}%'`;
	if(params.mandatoryReqs)
		query += ` AND MandatoryReqs LIKE '%${params.mandatoryReqs}%'`;	

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

exports.generateProjectCertTextsInsertQuery = (params) => {

	let query = `DECLARE @exists INT;
		SELECT @exists = COUNT(*) FROM dbo.ProjectCertTexts 
		WHERE ProjectID = ${params.projectId}
		IF @exists = 0
		BEGIN
			INSERT INTO dbo.ProjectCertTexts (
				ProjectID
				, Header
				, CancellationNotice
				, Disclaimer
				, MandatoryReqs
			) VALUES (
				${params.projectId}
				,'${params.header || ''}'
				,'${params.cancellationNotice || ''}'
				,'${params.disclaimer || ''}'
				,'${params.mandatoryReqs || ''}'
			)			
		END`;

	//console.log(query)
	return query;
}

exports.generateProjectCertTextsUpdateQuery = (params) => {

	let query = `UPDATE dbo.ProjectCertTexts SET 
		Header = '${params.header || ''}'
		, CancellationNotice = '${params.cancellationNotice || ''}'
		, Disclaimer = '${params.disclaimer || ''}'
		, MandatoryReqs = '${params.mandatoryReqs || ''}'
		WHERE ProjectId = ${params.projectId}`;

	//console.log('QUERY', query);
	return query;
}