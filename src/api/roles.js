const roles_mssql = require('../mssql/roles');
const error_helper = require('../helpers/error_helper')

// GET all roles
exports.getRoles = async function(req, res) {
  var roles = await roles_mssql.getRoles();	
	return res.status(200).json({ success: true, data: { roles: roles } });
};

// GET all roles with filters
exports.getRolesExt = async function(req, res) {

  roles_mssql.getRolesExt(function(err, result) {
    if (err){
      var error = error_helper.getSqlErrorData (err);
      return res.status(500).send(error);
    }

    return res.status(200).json({ success: true, roles: result });
  });

};
