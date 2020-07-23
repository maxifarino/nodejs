var _ = require('underscore');
const sql = require('mssql');
const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper');
const users_query_provider = require('../providers/users_query_provider');

// let roles = [];

exports.loadRoles = async function() {
	try {
		const connection = await sql_helper.getConnection();
		const query = `SELECT * FROM Roles ORDER BY name ASC`;
		const result = await connection.request().query(query);
		connection.close();

		if(result.recordset.length > 0) 
		{
			roles = result.recordset;
			const { CFRoles, PQRoles } = splitRolesBySystem(roles);
			// CFRoles = result.recordset.filter(function(r) {
			// 	if (r.System == 'cf') {
			// 		delete r.IsPrequalRole;
			// 		delete r.IsHCRole;
			// 		delete r.IsSCRole;
			// 	}
			// 	return r.System == 'cf';
			// });
			// PQRoles = result.recordset.filter(function(r) {
			// 	if (r.System == 'pq') {
			// 		delete r.IsCFRole;
			// 		delete r.IsHLRole;
			// 		delete r.IsINRole;
			// 		delete r.IsAMRole;
			// 	}
			// 	return r.System == 'pq';
			// });
			return { PQRoles, CFRoles };
		} 
		else {
			console.log("No roles found");
			return [];
		}
	}
	catch (err) {
		// callback(error_helper.getSqlErrorData(err), null);
		return error_helper.getSqlErrorData(err);
	}
}

exports.getRoles = async function() {  //reload
	// if(reload || roles.length <= 0){
	console.log("retrieving roles");
	let roles = await this.loadRoles();
	// console.log("END",roles);
	return roles;
	// }
}

exports.getUserRole = async function(user) {
	// if(roles.length <= 0){
	// 	console.log("retrieving roles.");
	// 	await this.loadRoles(function(err, roles){
	// 	});
	// }
	console.log("retrieving roles.");
	let result = await this.loadRoles();

	let userRoles = { PQRole: null, CFRole: null };
	let index = -1;
	let CFindex = -1;
	console.log("user roles",user.RoleID, user.CFRoleId);
	if (user.RoleID !== null) { // User has access to Prequal
		index = _.findIndex(result.PQRoles, (item) => { 
			return (item.Id.toString() == user.RoleID.toString());
		});
	}
	if (user.CFRoleId !== null && user.CFRoleId > 7) { // User has access to Certfocus
		CFindex = _.findIndex(result.CFRoles, (item) => { 
			return (item.Id.toString() == user.CFRoleId.toString());
		});
	}
	if(index != -1) {
		userRoles.Role = result.PQRoles[index];
		delete userRoles.Role.IsCFRole;
		delete userRoles.Role.IsHLRole;
		delete userRoles.Role.IsINRole;
		delete userRoles.Role.IsAMRole;
	}
	if(CFindex != -1) {
		userRoles.CFRole = result.CFRoles[CFindex];
		delete userRoles.CFRole.IsPrequalRole;
		delete userRoles.CFRole.IsHCRole;
		delete userRoles.CFRole.IsSCRole;
	}
	return userRoles;

}

exports.getRolesExt = async function(callback) {
	try {
		const connection = await sql_helper.getConnection();
		query = users_query_provider.generateRolesExtQuery();
    result = await connection.request().query(query);				
		const { CFRoles, PQRoles } = splitRolesBySystem(result.recordset);

		callback(null, { PQRoles, CFRoles });
	}
	catch (err) {
		console.log(err);
		callback(err, null, null);
	}
}


function splitRolesBySystem(roles) {
	let userRoles = { PQRole: null, CFRole: null };
	if(roles.length > 0) 
	{
		let CFRoles = roles.filter(function(r) {
			if (r.System == 'cf') {
				if (typeof r.IsPrequalRole !== 'undefined')delete r.IsPrequalRole;
				if (typeof r.IsHCRole !== 'undefined')delete r.IsHCRole;
				if (typeof r.IsSCRole !== 'undefined')delete r.IsSCRole;
			}
			return r.System == 'cf';
		});
		let PQRoles = roles.filter(function(r) {
			if (r.System == 'pq') {
				if (typeof r.IsCFRole !== 'undefined') delete r.IsCFRole;
				if (typeof r.IsHLRole !== 'undefined') delete r.IsHLRole;
				if (typeof r.IsINRole !== 'undefined') delete r.IsINRole;
				if (typeof r.IsAMRole !== 'undefined')delete r.IsAMRole;
			}
			return r.System == 'pq';
		});
		return { PQRoles, CFRoles };
	} 
	return userRoles;	
}