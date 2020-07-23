exports.generateHolderSettingsQuery = (params) => {
	
	let query = `SELECT  
		CFRevisedWordingPresent
		, CFCompliantAndAccepted
		, CFRevisedDates
		, CFNonDateFields
		, CFApplyingCertificates
		FROM dbo.HiringClients
		WHERE Id = ${params.holderId}
	`;

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


exports.generateHolderSettingsUpdateQuery = (params) => {

	let query = `UPDATE dbo.HiringClients SET `;
	
	if(params.CFRevisedWordingPresent)
		query += `CFRevisedWordingPresent = ${params.CFRevisedWordingPresent},`;
	if(params.CFCompliantAndAccepted)
		query += `CFCompliantAndAccepted = ${params.CFCompliantAndAccepted},`;
	if(params.CFRevisedDates)
		query += `CFRevisedDates = ${params.CFRevisedDates},`;
	if(params.CFNonDateFields)
		query += `CFNonDateFields = ${params.CFNonDateFields},`;
	if(params.CFApplyingCertificates)
		query += `CFApplyingCertificates = ${params.CFApplyingCertificates},`;	

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE Id = ${params.holderId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateHolderSettingsDataEntryOptionsQuery = (params) => {
	
	let query = `SELECT OptionId, OptionName
		FROM dbo.HolderSettings_DataEntryOptions`;
 	
	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}
	return query;
}

exports.generateHolderSettingsCertificateOptionsQuery = (params) => {
	
	let query = `SELECT OptionId, OptionName
		FROM dbo.HolderSettings_CertificatesOptions`;
 	
	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}	
	return query;
}