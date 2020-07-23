Select	SF.Id SF_ID, --SavedForms fields	
		F.Id F_Id, F.Name F_Name, --Forms fields
		FS.Id FS_ID, FS.InternalName FS_InternalName, FS.Title FS_Title, FS.PositionIndex FS_PositionIndex, --FormsSections Fields
		FSF.Id FSF_Id, FSF.InternalName FSF_InternalName, FFT.Id FFT_Id, FFT.Name FFT_Name, --FormsSectionsFields
		FSF.ColumnPos FSF_ColumnPos, FSF.RowPos FSF_RowPos, FSF.FieldLength FSF_FieldLength, FSF.ValueLength FSF_ValueLength, --FormsSectionsFields
		FSF.MinValue FSF_MinValue, FSF.MaxValue FSF_MaxValue, FSF.IsMandatory FSF_IsMandatory, --FormsSectionsFields
		FSF.Option1Label FSF_Option1Label, FSF.Option2Label FSF_Option2Label, FSF.Option3Label FSF_Option3Label, --FormsSectionsFields
		FSF.PickerSelectStatement FSF_PickerSelectStatement, --FormsSectionsFields
		FSF.DefaultValue FSF_DefaultValue,
		(Select SavedFormFieldsValues.Value From SavedFormFieldsValues Where SavedFormFieldsValues.FormSectionFieldId = FSF.Id) As SFFV_Value --SavedFormFieldsValues
From	SavedForms SF,
		Forms F,
		FormsSections FS,
		FormsSectionsFields FSF,
		FormFieldsTypes FFT
Where	SF.Id = 1 --Parameter
And		SF.FormId = F.Id
And     F.Id = FS.FormId
And		FS.Id = FSF.FormSectionId
And		FSF.TypeId = FFT.Id
Order By F.Name Asc, FS.PositionIndex Asc, FSF.RowPos, FSF.ColumnPos
