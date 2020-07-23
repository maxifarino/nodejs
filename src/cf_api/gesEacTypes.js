const error_helper = require('../helpers/error_helper');
const gesEacTypes = require('../cf_mssql/gesEacTypes');

exports.getTypes = async (req, res) => {
  let queryParams = req.query || {};
  await gesEacTypes.getRules(queryParams, (err, types) => {
    if (err) {
      error = error_helper.getSqlErrorData(err);
    }
    return res.status(200).json({ success: true, types: types });
  });
};