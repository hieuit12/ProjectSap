sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {
		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createAppViewModel: function () {
			return new JSONModel({
				busy: false,
				delay: 0,
				title: "Smart Warehouse"
			});
		},

		createFilterModel: function () {
			return new JSONModel({
				materialId: "",
				materialType: "",
				plant: "",
				storageLocation: ""
			});
		},

		createFormModel: function () {
			return new JSONModel({
				materialForm: {
					MaterialId: "",
					MaterialName: "",
					MaterialType: "",
					BaseUnit: "",
					Plant: "",
					StorageLocation: ""
				},
				stockForm: {
					MaterialId: "",
					Plant: "",
					StorageLocation: "",
					Quantity: 0
				},
				goodsReceiptForm: {
					MaterialId: "",
					Plant: "",
					StorageLocation: "",
					Quantity: 0,
					PostingDate: new Date(),
					DocumentDate: new Date(),
					Remark: ""
				},
				filteredSLocs: []
			});
		}
	};
});