const sql_helper = require('../mssql/mssql_helper');
const query_provider = require('../cf_providers/holders_query_provider');
const error_helper = require('../helpers/error_helper');
const logger = require('../mssql/log');

var _ = require('underscore');
const users_query_provider = require('../providers/users_query_provider');


exports.getHoldersAccountManagers = async function (callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = `SELECT id,CONCAT(FirstName,' ',LastName) AS name FROM Users WHERE CFRoleId IN (SELECT id FROM Roles WHERE System = 'cf' AND IsAMRole = 1) ORDER BY name ASC`;
		console.log("QUERY", query);
		const result = await connection.request().query(query);
		connection.close();

		if (result.recordset.length > 0) {
			users = result.recordset;
			callback(null, users);
		}
		else {
			console.log("No users found");
			callback(null, []);
		}
	}
	catch (err) {
		callback(error_helper.getSqlErrorData(err), null);
	}
}

exports.createHolder = async function (params, callback) {
	let query = null;
	if (!params.holderId) {
		query = query_provider.generateHolderInsertQuery(params);
		query = sql_helper.getLastIdentityQuery(query, 'HiringClients');
	}
	if (params.holderId) {
		query = query_provider.generateHolderUpdateQuery(params);
	}

	sql_helper.createTransaction(query, function (err, result, holderId) {
		if (err) {
			return callback(err);
		}

		let locHolderId = null;

		if (!params.holderId) {
			locHolderId = holderId;
		}
		else {
			locHolderId = params.holderId
		}

		callback(null, result, locHolderId);

		// const logParams = {
		// 	eventDescription: params.eventDescription,
		// 	UserId: params.userId,
		// 	Payload: holderId
		// }

		// logger.addEntry(logParams, function (err, result) {
		// 	if(err) {
		// 		console.log("There was an error creating log for: ");
		// 		console.log(logParams);
		// 		console.log(err);
		// 	} else {
		// 		console.log("Log succesfully created");
		// 	}
		// 	return;
		// });
	});
}


exports.getHolders = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		let queryParams = {}

		queryParams = params;
		if (params.pageSize && params.pageNumber) {
			queryParams.pagination = {}
			queryParams.pagination.pageSize = params.pageSize;
			queryParams.pagination.pageNumber = params.pageNumber;
		}

		const getChildren = async childId => {
			const connection = await sql_helper.getConnection();
			const query = query_provider.generateGetParentsQuery(childId);
			const result = await connection.request().query(query);
			let ids = [];
			for (let row of result.recordset) {
				const { Id, ParentHiringClientId } = row;
				ids.push(Id);
				if (!_.isEmpty(ParentHiringClientId)) {
					const res = await getChildren(ParentHiringClientId)
					ids.push(...res);
				}
			};
			return ids;
		};

		if (params.pageNumber) {
			queryParams.getTotalCount = true;
			var totalRowsCount = 0;
			var query = query_provider.generateHoldersQuery(queryParams);
			var result = await connection.request().query(query);
			totalRowsCount = result.recordset.length;
		}

		queryParams.getTotalCount = false;
		query = query_provider.generateHoldersQuery(queryParams);
		result = await connection.request().query(query);

		if (queryParams.nameTerm) {
			let ids = result.recordset.map(row => row.id);
			for (let row of result.recordset) {
				const { id } = row;
				const children = await getChildren(id);
				ids.push(...children);
			}
			query = query_provider.getHoldersByIds(ids);
			result = await connection.request().query(query);
		}

		connection.close();
		if (!params.pageNumber) {
			totalRowsCount = result.recordset.length;
		}

		if (result.recordset.length > 0) {
			callback(null, result.recordset, totalRowsCount);
		} else {
			console.log("No hiring client found.");
			callback(null, null, totalRowsCount);
		}
	}
	catch (err) {
		console.log(err);
		callback(err, null, null);
	}
}

exports.getHolderDetail = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();

		const query = query_provider.generateHolderDetailQuery(params);
		console.log('Maxi query:', query);
		const result = await connection.request().query(query);
		connection.close();

		callback(null, result.recordset);
	}
	catch (err) {
		callback(err, null);
	}
}

exports.holderArchive = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();

		const query = query_provider.generateHolderArchiveQuery(params.holderId, params.status);
		console.log('query holderArchive',query);
		await connection.request().query(query);
		connection.close();

		callback(null, true);
	}
	catch (err) {
		callback(err, null);
	}
}

exports.getHolderChildren = async function (params, callback) {
	try {
		const connection = await sql_helper.getConnection();
		const query = query_provider.generateGetHolderChildrenQuery(params);
		const result = await connection.request().query(query);
		connection.close();
		callback(null, result.recordset);
	}
	catch (err) {
		callback(err, null);
	}
}

exports.changeHolderUserStatus = async (params) => {
	const connection = await sql_helper.getConnection();
	const {holderId, userId} = params;

	let query = query_provider.generateToggleHolderUserStatus(parseInt(holderId), parseInt(userId));
	return await connection.request().query(query)
		.then( res => {
			return res.rowsAffected[0] >= 1;
		})
		.catch( error => {
			return Promise.reject(error);
		})
};

exports.getHoldersAccountManager = async (holderId) => {
	const connection = await sql_helper.getConnection();

	let query = query_provider.getHolderAccountManager(parseInt(holderId));
	return await connection.request().query(query)
		.then( res => {
			return res.recordset;
		})
		.catch( error => {
			return Promise.reject(error);
		})
}