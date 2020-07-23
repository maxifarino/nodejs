const error_helper = require('../helpers/error_helper');
const departments = require('../cf_mssql/departments');

exports.saveDepartment = async (req, res) => {
  let params = req.body;
  let invalidData = false;

  if(!params) {
    invalidData = true;
  }

  if(!params.name) {
    invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  await departments.createDepartment(params, (err, result, departmentId) => {
    if(err) {
      error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }

    return res.status(200).json({ success: true, data: { departmentId: departmentId } });

  })

}

exports.updateDepartment = async (req, res) => {
  let params = req.body;
  let invalidData = false;

  if(!params) {
    invalidData = true;
  }

  if(!params.id) {
    invalidData = true;
  }

  if(!params.name && (typeof params.archived === 'undefined') ) {
    invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  if (typeof params.archived === 'undefined') {
    // UPDATING DEPARTMENT'S NAME
    await departments.updateDepartment(params, (err) => {
      if(err) {
        error = error_helper.getSqlErrorData(err);
        return res.send(error);
      }

      return res.status(200).json({ success: true});

    })
  } else {
    await departments.updateDepartmentStatus(params, (err) => {
      if(err) {
        error = error_helper.getSqlErrorData(err);
        return res.send(error);
      }

      return res.status(200).json({ success: true});

    })
  }



}

exports.getDepartments = async (req, res) => {
  let params = req.query;

  let invalidData = false;

  if(!params) {
    invalidData = true;
  }

  // if (!params.pageNumber || isNaN(parseInt(params.pageNumber))) invalidData = true;

  if (params.orderBy !== 'created' && params.orderBy !== 'name' && params.orderBy !== 'archived') invalidData = true;

  if (params.orderDirection.toUpperCase() !== 'ASC' && params.orderDirection.toUpperCase() !== 'DESC')  invalidData = true;

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  await departments.getDepartments(params, (err, result, totalCount, roles) => {
    if(err) {
      error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }

    return res.status(200).json({ success: true, data: result, totalCount: totalCount, roles: roles });

  })
}

exports.removeDepartmentUser = async (req, res) => {
  let params = req.body;

  let invalidData = false;

  if(!params) {
    invalidData = true;
  }

  if (!params.departmentId || isNaN(Number.parseInt(params.departmentId))) invalidData = true;
  if (!params.userId || isNaN(Number.parseInt(params.userId))) invalidData = true;


  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  await departments.removeDepartmentUser(params, (err, result) => {
    if(err) {
      error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }

    return res.status(200).json({ success: true, rowDeleted: result});

  })
}

exports.addDepartmentUser = async (req, res) => {
  let params = req.body;

  let invalidData = false;

  if(!params) {
    invalidData = true;
  }

  if (!params.departmentId || isNaN(Number.parseInt(params.departmentId))) invalidData = true;
  if (!params.userId || isNaN(Number.parseInt(params.userId))) invalidData = true;


  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  await departments.addDepartmentUser(params, (err, result) => {
    if(err) {
      error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }

    return res.status(200).json({ success: true, data: result });

  })
}

exports.getDepartmentUsers = async (req, res) => {
  let params = req.query;

  let invalidData = false;

  if(!params) {
    invalidData = true;
  }

  if (!params.departmentId || isNaN(Number.parseInt(params.departmentId))) invalidData = true;

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }
  await departments.getDepartmentUsers(params, (err, holdersUsers, users) => {
    if(err) {
      error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }

    return res.status(200).json({ success: true, data: {holdersUsers: holdersUsers, users: users} });

  })
}