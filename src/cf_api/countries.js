const error_helper = require('../helpers/error_helper');
const countries = require('../cf_mssql/countries');

exports.getCountries = async function(req, res) {
  const params = {}
  const data = {};

  countries.getCountries(params, function(err, result) {
    if(err) {
      return res.send(err);
    }
    //console.log("RESULT", result);
    if(!result) {
      let error = error_helper.getErrorData(error_helper.CODE_CONTACTS_NOT_FOUND, error_helper.MSG_COUNTRIES_NOT_FOUND);
      return res.send(error);
    }
    data.totalCount = result.length;
    data.countries = result.recordset;

    return res.status(200).json( { success: true, data: data });
  });
}

exports.getStates = async function(req, res) {
  const params = {}
  const data = {};

  countries.getStates(params, function(err, result) {
    if(err) {
      return res.send(err);
    }
    //console.log("RESULT", result);
    if(!result) {
      let error = error_helper.getErrorData(error_helper.CODE_STATES_NOT_FOUND, error_helper.MSG_STATES_NOT_FOUND);
      return res.send(error);
    }
    data.totalCount = result.length;
    data.states = result.recordset;

    return res.status(200).json( { success: true, data: data });
  });
}