exports.generateInvoicesQuery = (params) => {
	
	let query = `SELECT 
		InvoiceID
		, InsuredID
		,	InvoiceDate
		, InvoiceAmount
		, VoidFlag
		, VoidReason
		, InvoiceStatusID
		, OutstandingBalance
		, CreatedBy
		, CreatedDate
		FROM dbo.Invoices 
		WHERE 1=1`;
 	
	if(params.invoiceId)
		query += ` AND InvoiceID = ${params.invoiceId}`;
	if(params.invoiceDate)
    query += ` AND InvoiceDate = '%${params.invoiceDate}%'`;
	if(params.insuredId)
		query += ` AND InsuredID = ${params.insuredId}`;
	
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

exports.generateInvoicesInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Invoices (
		InsuredID
		, InvoiceDate
		, InvoiceAmount
		, VoidFlag
		, VoidReason
		, InvoiceStatusID
		, OutstandingBalance
		, CreatedBy
		, CreatedDate
	) VALUES (
		${params.insuredId}
		, '${params.invoiceDate}'
		, ${params.invoiceAmount}
		, ${params.voidFlag || 0}
		, '${params.voidReason}'
		, ${params.invoiceStatusId}
		, ${params.outstandingBalance || 0}
		, ${params.createdBy}
		, getDate()
	)`;
	
  console.log(query)
	return query;
}

exports.generateInvoicesDeleteQuery = (params) => {

	let query = `DELETE dbo.Invoices WHERE InvoiceID = ${params.invoiceId}`;
	//console.log(query)
	return query;
}

exports.generateFinanceQuery = (params) => {
	
	let query = `SELECT 
			InvoiceID AS TransactionNumber
			, InvoiceDate AS TransactionDate
			, InvoiceAmount AS Amount
			, 'Invoice' AS Activity
			, 0 AS AmountCredits
			, 0 AS CreditBalance
		FROM dbo.Invoices
		WHERE InsuredID = ${params.insuredId}
	UNION 
		SELECT 
			PaymentID AS TransactionNumber
			, PaymentDate AS TransactionDate
			, PaymentAmount AS Amount
			, 'Payment' AS Activity
			, 0 AS AmountCredits
			, 0 AS CreditBalance
		FROM dbo.Payments	P
		WHERE InsuredID = ${params.insuredId}
	UNION 		
		SELECT 
			RefundID AS TransactionNumber
			, RefundCreatedDate AS TransactionDate
			, RefundAmount AS Amount
			, 'Refund' AS Activity
			, 0 AS AmountCredits
			, 0 AS CreditBalance
		FROM dbo.Refunds R
		INNER JOIN dbo.Payments P ON P.PaymentID = R.PaymentID
		WHERE P.InsuredID = ${params.insuredId}
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
