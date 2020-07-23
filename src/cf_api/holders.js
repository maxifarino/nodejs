const Holders = require('../cf_mssql/holders')
const contacts = require('../cf_mssql/contacts');
const query_provider = require('../providers/query_provider');

const sql_helper = require('../mssql/mssql_helper');
const error_helper = require('../helpers/error_helper');
const _ = require('underscore')

exports.createHolder = async function (req, res) {

	let invalidData = false;
	let params = req.body;

	if (!params) {
		invalidData = true;
	}
	else {
		if (!params.holderName || !params.country || !params.phoneNumber
			|| !params.address1 || !params.city || !params.state || !params.postalCode) {
			invalidData = true;
		}

		if (params.holderId && (parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId)))) invalidData = true;
	}

	if (invalidData == true) {
		const error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	let method = req.method;
	let originalUrl = req.originalUrl;
	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;

	console.log('create holder', params);
	// Create HC
	await Holders.createHolder(params, async function (err, result, hlId) {
		console.log('create holder result', result);
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		let contact = {};
		contact.firstName = params.contactName;
		contact.lastName = ' ';
		contact.phoneNumber = params.contactPhone;
		contact.mobileNumber = ' ';
		contact.emailAddress = params.contactEmail;
		contact.holderId = hlId;

		if (!params.holderId) {
			// create contact
			await contacts.createContact(contact, async function (err, result, cId) {
				console.log('create contact result', result);
				if (err) {
					error = error_helper.getSqlErrorData(err);
					return res.send(error);
				}


				await contacts.linkContactAndHolder({ holderId: hlId, contactId: cId }, function (err, result) {
					if (err) {
						error = error_helper.getSqlErrorData(err);
						return res.send(error);
					}

					let locHolderId = hlId;
					if (params.holderId)
						locHolderId = params.holderId;

					return res.status(200).json({ success: true, data: { hlId: locHolderId } });

				});
			});

		}
		else {
			// update contact
			contact.contactId = params.contactId;
			await contacts.createContact(contact, async function (err, result, cId) {
				console.log('update contact result', result);
				if (err) {
					error = error_helper.getSqlErrorData(err);
					return res.send(error);
				}

				if (!params.contactId) {
					await contacts.linkContactAndHolder({ holderId: hlId, contactId: cId }, function (err, result) {
						if (err) {
							error = error_helper.getSqlErrorData(err);
							return res.send(error);
						}

						return res.status(200).json({ success: true, data: { hlId: hlId } });
					});
				} else {
					return res.status(200).json({ success: true, data: { hlId: hlId } });
				}
			});
		}
	});
};

exports.getHoldersAccountManagers = async function (req, res) {
	await Holders.getHoldersAccountManagers(function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { accountManagers: result } });
	});
};

exports.getHolders = async function (req, res) {
	const params = {};
	let retVal = {};
	let invalidData = false

	if (req.query.onlyHolderParents && (req.query.onlyHolderParents !== 'true' && req.query.onlyHolderParents !== 'false')) invalidData = true;
	if (req.query.excludeHolderId && (parseInt(req.query.excludeHolderId) <= 0 || isNaN(parseInt(req.query.excludeHolderId)))) invalidData = true;

	if (req.query.pageSize && (parseInt(req.query.pageSize) <= 0 || isNaN(parseInt(req.query.pageSize)))) invalidData = true;
	if (req.query.subcontractorId && (parseInt(req.query.subcontractorId) <= 0 || isNaN(parseInt(req.query.subcontractorId)))) invalidData = true;

	if (req.query.orderBy && (req.query.orderBy !== 'id' && req.query.orderBy !== 'name'
		&& req.query.orderBy !== 'registrationUrl'
		&& req.query.orderBy !== 'country'
		&& req.query.orderBy !== 'phone'
		&& req.query.orderBy !== 'contactName'
		&& req.query.orderBy !== 'state'
		&& req.query.orderBy !== 'parentHolder'
		&& req.query.orderBy !== 'portalURL')
	) invalidData = true;

	if (req.query.orderDirection && (req.query.orderDirection !== "ASC" && req.query.orderDirection !== "DESC")) invalidData = true;
	if (req.query.pageNumber && (parseInt(req.query.pageNumber) <= 0 || isNaN(parseInt(req.query.pageNumber)))) invalidData = true;
	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	if (req.query.userId) {
		params.userId = req.query.userId;
	}

	if (!req.query.userId)
		params.userId = req.currentUser.Id;

	params.pageSize = parseInt(req.query.pageSize);
	params.pageNumber = parseInt(req.query.pageNumber);
	params.onlyParents = (req.query.onlyParents == 'true');
	params.orderBy = req.query.orderBy;
	params.orderDirection = req.query.orderDirection;
	params.searchTerm = req.query.searchTerm;
	params.nameTerm = req.query.nameTerm;
	params.contactNameTerm = req.query.contactNameTerm;
	params.subcontractorId = req.query.subcontractorId;

	params.onlyHolderParents = req.query.onlyHolderParents;
	params.excludeHolderId = req.query.excludeHolderId;
	params.filterTerm = req.query.filterTerm;

	params.summary = req.query.onlyHolderParents ? true : req.query.summary;
	params.archive = req.query.archive;

	let roleId = 0;
	let CFRoleId = 0;
	if (params.userId) {
		const connection = await sql_helper.getConnection();
		query = query_provider.generateRoleByUserQuery(params);
		result = await connection.request().query(query);
		roleId = result.recordset[0].roleId;
		CFRoleId = result.recordset[0].CFRoleId;
	}
	console.log('USER ROLES', roleId, CFRoleId);
	params.roleId = roleId;
	params.CFRoleId = CFRoleId;

	await Holders.getHolders(params, async function (err, result, totalRowsCount) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		if (!result) {
			error = error_helper.getErrorData(error_helper.CODE_HOLDERS_NOT_FOUND, error_helper.MSG_HOLDERS_NOT_FOUND);
			console.log(error);
			return res.send(error);
		} else {
			retVal.holders = result;
			retVal.totalCount = totalRowsCount;

			return res.status(200).json({ success: true, data: retVal });
		}
	});

};


exports.getHolderDetail = async function (req, res) {
	try {
		const params = {};
		let retVal = {};
		let invalidData = false

		if (req.query.holderId && (parseInt(req.query.holderId) <= 0 || isNaN(parseInt(req.query.holderId)))) invalidData = true;
		if (invalidData) {
			let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
			return res.send(error);
		}

		if (req.query.holderId) {
			params.holderId = req.query.holderId;
		}

		if (req.query.holderName) {
			params.holderName = req.query.holderName;
		}

		await Holders.getHolderDetail(params, async function (err, result) {
			if (err) {
				console.log(err);
				error = error_helper.getSqlErrorData(err);
			}
			if (!result) {
				error = error_helper.getErrorData(error_helper.CODE_HOLDERS_NOT_FOUND, error_helper.MSG_HOLDERS_NOT_FOUND);
				console.log(error);
				return res.send(error);
			}

			let entries = []

			if (result != null)
				if (result.length > 0) {
					await _getLogo(params.holderId, function (err, resultLogo) {
						if (err) {
							console.log(err);
							result[0].logo = '';
							entries.push(result[0]);
						}
						else {
							result[0].logo = resultLogo;
							entries.push(result[0]);
						}
						return res.status(200).json({ success: true, data: entries });
					});
				}
		});
	}
	catch (err) {
		console.log(err);
		return res.status(500).send(err);
	}
};

exports.getGESData = async function (req, res) {
	try {
		const params = {};
		params.holderId = process.env.GES_HC;

		await Holders.getHolderDetail(params, async function (err, result) {
			if (err) {
				console.log(err);
				error = error_helper.getSqlErrorData(err);
			}
			if (!result) {
				error = error_helper.getErrorData(error_helper.CODE_HOLDERS_NOT_FOUND, error_helper.MSG_HOLDERS_NOT_FOUND);
				console.log(error);
				return res.send(error);
			}

			let entries = [{
				"PortalHomepageText": result[0].PortalHomepageText,
				"PortalFaqText": result[0].PortalFaqText,
			}];
			return res.status(200).json({ success: true, data: entries });
		});
	}
	catch (err) {
		console.log(err);
		return res.status(500).send(err);
	}
};

exports.archiveHolder = async function (req, res) {
	try {
		const params = req.body;

		await Holders.holderArchive(params, async function (err, result) {
			if (err) {
				console.log(err);
				error = error_helper.getSqlErrorData(err);
			}
			if (!result) {
				error = error_helper.getErrorData(error_helper.CODE_HOLDERS_NOT_FOUND, error_helper.MSG_HOLDERS_NOT_FOUND);
				console.log(error);
				return res.send(error);
			}
			return res.status(200).json({ success: true });
		});
	}
	catch (err) {
		console.log(err);
		return res.status(500).send(err);
	}
}

exports.toogleHolderUserStatus = async (req, res) => {
	try {
		let queryParams = req.body || {};

		let invalidData = false;

		if (isNaN(parseInt(queryParams.holderId)) || queryParams.holderId && (parseInt(queryParams.holderId) <= 0)) invalidData = true;
		if (isNaN(parseInt(queryParams.userId)) || queryParams.userId && (parseInt(queryParams.userId) <= 0)) invalidData = true;

		if (invalidData) return invalidDataResponse(res);

		return await Holders.changeHolderUserStatus(queryParams)
			.then( response => {
				let data = {
					statusChanged: response,
				};
				return res.status(200).json({ success: true, data });
			})
			.catch( error => {
				let errorMsg = error_helper.getSqlErrorData(error);
				return res.send(errorMsg);
			})
	}
	catch (err) {
		console.log(err);
		return res.status(500).send(err);
	}
}