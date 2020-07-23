exports.generateRefundsQuery = (params) => {
	
	let query = `SELECT 
		RefundID
		,	PaymentID
		, RefundAmount
		, RefundReason
		, RefundMethodID
		, RefundCreatedByID
		, RefundCreatedDate
		, RefundApprovedByID
		, RefundApprovedDate
		FROM dbo.Refunds 
		WHERE 1=1`;
 	
	if(params.refundId)
		query += ` AND RefundID = ${params.refundId}`;
	if(params.paymentId)
		query += ` AND PaymentID = ${params.paymentId}`;
	
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

exports.generateRefundsInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Refunds (
		PaymentID
		, RefundAmount
		, RefundReason
		, RefundMethodID
		, RefundCreatedByID
		, RefundCreatedDate
		, RefundApprovedByID
		, RefundApprovedDate
	) VALUES (
		${params.paymentId}
		, ${params.refundAmount}
		, '${params.refundReason}'
		, ${params.refundMethodById}
		, ${params.refundCreatedById}
		, ${params.refundCreatedDate || 'getDate()'}
		, ${params.refundApprovedById || null}
		, ${params.refundApprovedDate || null}
	)`;
	
  //console.log(query)
	return query;
}

exports.generateRefundsUpdateQuery = (params) => {

	let query = `UPDATE dbo.Refunds SET `;
	
	if(params.paymentId)
		query += `PaymentID = ${params.paymentId},`;
	if(params.refundAmount)
		query += `RefundAmount = ${params.refundAmount},`;	
	if(params.refundReason)
		query += `RefundReason = '${params.refundReason}',`;
	if(params.refundMethodById)
		query += `RefundMethodID = ${params.refundMethodById},`;
	if(params.refundApprovedById)
		query += `RefundApprovedByID = ${params.refundApprovedById},`;
	if(params.refundApprovedDate)
		query += `RefundApprovedDate = ${params.refundApprovedDate},`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE RefundID = ${params.refundId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateRefundsDeleteQuery = (params) => {

	let query = `DELETE dbo.Refunds WHERE RefundID = ${params.refundId}`;
	//console.log(query)
	return query;
}