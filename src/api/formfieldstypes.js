const FormFieldsTypes = require('../mssql/formfieldstypes');

// GET all formFieldsTypes
exports.getFormFieldsTypes = async function(req, res) {
	var formFieldsTypes = await FormFieldsTypes.getFormFieldsTypes();
	return res.status(200).json({ success: true, data: { formFieldsTypes: formFieldsTypes } });
};