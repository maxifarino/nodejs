exports.generateInvoiceLineItemsQuery = (params) => {
	
	let query = `SELECT 
		InvoiceLineItemID
		, InvoiceID
		,	Quantity
		, UnitPrice
		, ExtendedPrice
		, ExpenseTypeID
		, ExpenseDescription
		FROM dbo.InvoiceLineItems
		WHERE 1=1`;
 	
	if(params.invoiceLineItemId)
		query += ` AND InvoiceLineItemID = ${params.invoiceLineItemId}`;
	if(params.invoiceId)
		query += ` AND InvoiceID = ${params.invoiceId}`;
	
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

exports.generateInvoiceLineItemsInsertQuery = (params) => {

	let query = `INSERT INTO dbo.InvoiceLineItems (
		InvoiceID
		,	Quantity
		, UnitPrice
		, ExtendedPrice
		, ExpenseTypeID
		, ExpenseDescription
	) VALUES (
		${params.invoiceId}
		, ${params.quantity}
		, ${params.unitPrice}
		, ${params.extendedPrice || 0}
		, ${params.expenseTypeId}
		, '${params.expenseDescription}'
	)`;
	
  //console.log(query)
	return query;
}

exports.generateInvoiceLineItemsUpdateQuery = (params) => {

	let query = `UPDATE dbo.InvoiceLineItems SET `;
		
	if(params.quantity)
		query += `Quantity = ${params.quantity},`;	
	if(params.unitPrice)
		query += `UnitPrice = ${params.unitPrice},`;
	if(params.extendedPrice)
		query += `ExtendedPrice = ${params.extendedPrice},`;
	if(params.expenseTypeId)
		query += `ExpenseTypeID = ${params.expenseTypeId},`;
	if(params.expenseDescription)
		query += `ExpenseDescription = '${params.expenseDescription}',`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE InvoiceLineItemID = ${params.invoiceLineItemId}`;

	//console.log('QUERY')
	return query;
}	
	
exports.generateInvoiceLineItemsDeleteQuery = (params) => {
	
	let query = `DELETE dbo.InvoiceLineItems
		WHERE InvoiceLineItemID = ${params.invoiceLineItemId}`;
	//console.log(query)
	return query;
}