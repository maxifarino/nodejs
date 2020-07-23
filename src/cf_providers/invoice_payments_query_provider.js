exports.generateInvoicePaymentsQuery = (params) => {
	
	let query = `SELECT 
		Invoice_PaymentID
		, InvoiceID
		,	PaymentID
		, AppliedAmount
		, AppliedByID
		, AppliedDate
		FROM dbo.Invoice_Payments 
		WHERE 1=1`;
 	
	if(params.invoiceId)
		query += ` AND InvoiceID = ${params.invoiceId}`;
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

exports.generateInvoicePaymentsInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Invoice_Payments (
		InvoiceID
		,	PaymentID
		, AppliedAmount
		, AppliedByID
		, AppliedDate
	) VALUES (
		${params.invoiceId}
		, ${params.paymentId}
		, ${params.appliedAmount}
		, ${params.appliedById}
		, getDate()
	)`;
	
  //console.log(query)
	return query;
}

exports.generateInvoicePaymentsUpdateQuery = (params) => {

	let query = `UPDATE dbo.Invoice_Payments SET `;
		
	if(params.appliedAmount)
		query += `AppliedAmount = ${params.appliedAmount},`;	
	if(params.appliedById)
		query += `AppliedByID = ${params.appliedById},`;

	query += `AppliedDate = getDate(),`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE Invoice_PaymentID = ${params.invoicePaymentId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateInvoicePaymentsDeleteQuery = (params) => {

	let query = `DELETE dbo.Invoice_Payments 
		WHERE Invoice_PaymentID = ${params.invoicePaymentId}`;
	//console.log(query)
	return query;
}