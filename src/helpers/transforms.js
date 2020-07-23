const forms_mssql = require('../mssql/forms.js');
const files_api = require('../api/files.js');
_ = require('underscore');

exports.formsRecorsetToResponse = async function (recordset, params, justFormData) {
	let forms = []
	let i = 0;
	let pageSize = null;
	let pageNumber = null;
	let pagination = null;
	let orderBy = null;

	if (params) {
		pagination = params.pagination;
		orderBy = params.orderBy;
	}
	// if(pagination) {
	// 	pageSize = pagination.pageSize;
	// 	pageNumber = pagination.pageNumber;
	// }

	while (i < recordset.length) {
		let currentFormId = recordset[i].F_Id;
		let form = {}
		form.id = recordset[i].F_Id;
		form.name = recordset[i].F_Name;
		form.description = recordset[i].F_Description;
		form.creator = recordset[i].U_FirstName + ' ' + recordset[i].U_LastName;
		form.dateCreated = recordset[i].F_DateCreated;
		form.isComplete = recordset[i].F_IsComplete;
		form.subcontractorFee = recordset[i].F_SubcontractorFee;
		form.hiringClientId = recordset[i].F_HiringClientId;
		form.formSections = [];
		form.selected = recordset[i].selected;
		form.accountDisplayTypeId = recordset[i].F_AccountDisplayTypeId;
		form.scorecardHiddenFields = recordset[i].scorecardHiddenFields;

		if (justFormData != 'true') {
			while (i < recordset.length && recordset[i].F_Id === currentFormId) {
				let currentSection = {};
				currentSection.id = recordset[i].FS_ID;
				currentSection.internalName = recordset[i].FS_InternalName;
				currentSection.title = recordset[i].FS_Title;
				currentSection.positionIndex = recordset[i].FS_PositionIndex;
				currentSection.fields = [];

				while (i < recordset.length && recordset[i].FS_ID === currentSection.id) {
					let formSectionField = {};
					formSectionField.Id = recordset[i].FSF_Id;
					formSectionField.internalName = recordset[i].FSF_InternalName;
					formSectionField.referenceId = recordset[i].FFT_ReferenceId;
					formSectionField.caption = recordset[i].FFT_Caption;
					formSectionField.controlGroup = recordset[i].FFT_ControlGroup;
					formSectionField.isConditional = recordset[i].FFT_IsConditional;
					formSectionField.triggerFieldName = recordset[i].FFT_TriggerFieldName;
					formSectionField.urlTitle = recordset[i].FFT_UrlTitle;
					formSectionField.urlTarget = recordset[i].FFT_UrlTarget;

					if (recordset[i].FFT_Id == 18) {
						if (recordset[i].FFT_ReferenceId != null) {
							await forms_mssql.getFormFieldList(recordset[i].FFT_ReferenceId, function (err, result) {
								;
								formSectionField.possiblValues = [];
								if (result) {
									formSectionField.possiblValues = result;
								}
							});
						}
						else {
							formSectionField.possiblValues = [];
						}
					}

					formSectionField.type = recordset[i].FFT_Name;
					formSectionField.columnPos = recordset[i].FSF_ColumnPos;
					formSectionField.rowPos = recordset[i].FSF_RowPos;
					formSectionField.fieldLength = recordset[i].FSF_FieldLength;
					formSectionField.valueLength = recordset[i].FSF_ValueLength;
					formSectionField.minValue = recordset[i].FSF_MinValue;
					formSectionField.maxValue = recordset[i].FSF_MaxValue;
					formSectionField.isMandatory = recordset[i].FSF_IsMandatory === 1 ? "true" : "false";
					formSectionField.hasBorder = recordset[i].FSF_HasBorder;
					formSectionField.rowsCount = recordset[i].FSF_RowsCount;
					formSectionField.defaultValue = recordset[i].FSF_DefaultValue;

					if (recordset[i].SFFV_Value) {
						formSectionField.savedValue = recordset[i].SFFV_Value;
					}

					if (formSectionField.Id)
						currentSection.fields.push(formSectionField);
					i++
				}
				form.formSections.push(currentSection);
			}
		}

		if (justFormData == 'true') {
			i++
		}

		forms.push(form);
	}

	if (pagination.pageSize && pagination.pageNumber) {
		let pageSize = pagination.pageSize;
		let pageNumber = pagination.pageNumber;

		sliceIndex = pageSize * (pageNumber - 1);
		sliceEnd = sliceIndex + pageSize;
		let page = forms.slice(sliceIndex, sliceEnd)

		return { totalCount: forms.length, forms: page };
	}

	return { totalCount: forms.length, forms: forms };
}

exports.webhookObjectToMessageEvent = function (webhook) {

	const messageEvent = {
		'message-id': null,
		'event': null,
		'recipient': null,
		'domain': null,
		'ip': null,
		'country': null,
		'region': null,
		'city': null,
		'user-agent': null,
		'device-type': null,
		'client-type': null,
		'client-name': null,
		'client-os': null,
		'campaign-id': null,
		'campaign-name': null,
		'tag': null,
		'mailing-list': null,
		'custom-variables': null,
		'event-timestamp': null,
		'url': null,
		'message-headers': null,
		'bounce_code': null,
		'bounce_error': null,
		'bounce_notification': null,
		'dropped_code': null,
		'dropped_description': null,
		'timestamp': null
	};

	for (let key of Object.keys(webhook)) {
		let value = webhook[key];
		if (key == "Message-Id" || key == "message-id") {
			value = value.replace('<', '');
			value = value.replace('>', '');
			key = key.toLowerCase();
		}
		messageEvent[key] = value;
	}

	if (messageEvent.event === 'bounced') {
		messageEvent['bounce_code'] = webhook.code;
		messageEvent['bounce_error'] = webhook.error;
		messageEvent['bounce_notification'] = webhook.notification;
	}

	if (messageEvent.event === 'dropped') {
		messageEvent['dropped_code'] = webhook.code;
		messageEvent['dropped_description'] = webhook.description;
	}

	return messageEvent;
}

exports.templatesRecordsetToResponse = function (recordset, totalRowsCount) {
	const result = {}
	result.totalCount = totalRowsCount;
	result.templates = [];

	for (let record of recordset) {
		let template = {};
		template.id = record.Id;
		template.templateName = record.TemplateName;
		template.subject = record.Subject;
		template.bodyHTML = record.bodyHTML;
		template.bodyText = record.BodyText;
		template.replacedTemplateId = record.ReplacedTemplateId;
		template.templateActivityId = record.TemplateActivityId;
		template.communicationTypeId = record.CommunicationTypeId;
		template.fromAddress = record.FromAddress;
		template.ownerId = record.HiringClientId;
		template.templateCreator = record.TemplateCreator;
		template.dateCreation = record.TimeStamp;

		result.templates.push(template);
	}

	return result;
}

exports.generateLanguageKeysResponse = function (recordset) {
	const result = []

	for (let record of recordset) {
		let languageKey = {}
		languageKey.keyId = record.KeyId;
		languageKey.defaultValue = record.DefaultValue;
		languageKey.value = record.Value;

		result.push(languageKey);
	}

	return result;
}

exports.formsSavedValuesRecorsetToResponse = function (recordset) {
	const result = [];

	for (let record of recordset) {
		let field = {}
		field.formSectionFieldId = record.formSectionFieldId;
		field.savedValue = record.value;
		field.fileLink = null;
		if (record.hasLink == 1) {
			let documentFile = {};
			documentFile.name = record.value;
			if (record.fileId != null)
				field.fileLink = files_api.getDocumentFileName(documentFile.name, record.subcontractorId, record.fileId);
			else
				record.hasLink = null;
		}

		result.push(field);
	}

	return result;
}

