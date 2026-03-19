sap.ui.define([
	"com/sap341/smartwarehouse/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"com/sap341/smartwarehouse/model/models",
	"com/sap341/smartwarehouse/service/MaterialService",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"../model/Validator"
], function (BaseController, JSONModel, models, MaterialService, MessageBox, MessageToast, Fragment, Filter, FilterOperator, Sorter, Validator) {
	"use strict";

	return BaseController.extend("com.sap341.smartwarehouse.controller.MaterialList", {
		onInit: function () {
			this._oModel = this.getOwnerComponent().getModel();
			this.getView().setModel(models.createAppViewModel(), "appView");
			this.getView().setModel(models.createFormModel(), "formModel");
		},

		onRefresh: function () {
			this._oModel.refresh();
		},

		onSearch: function (oEvent) {
			var sQuery = oEvent.getParameter("query");
			this._applyFilters();
		},

		onFilterType: function () {
			this._applyFilters();
		},

		onResetFilters: function () {
			this.byId("searchField").setValue("");
			this.byId("typeFilter").setSelectedKey("");
			this._applyFilters();
			this.showMessage(this.getText("msgFiltersReset"));
		},

		_applyFilters: function () {
			var sQuery = this.byId("searchField").getValue();
			var sType = this.byId("typeFilter").getSelectedKey();
			var aFilters = [];

			if (sQuery) {
				sQuery = sQuery.toUpperCase();
				// BE MaterialSet chỉ parse filter theo MaterialId, rồi tự apply cho cả ID/Name (MATNR/MAKTX)
				aFilters.push(new Filter("MaterialId", FilterOperator.Contains, sQuery));
			}

			if (sType) {
				aFilters.push(new Filter("MaterialType", FilterOperator.EQ, sType));
			}

			this.byId("materialTable").getBinding("items").filter(aFilters);
		},

		onSort: function () {
			if (!this._oSortDialog) {
				Fragment.load({
					name: "com.sap341.smartwarehouse.fragment.SortDialog",
					controller: this
				}).then(function (oDialog) {
					this._oSortDialog = oDialog;
					this.getView().addDependent(this._oSortDialog);
					this._oSortDialog.open();
				}.bind(this));
			} else {
				this._oSortDialog.open();
			}
		},

		onConfirmSort: function (oEvent) {
			var oParams = oEvent.getParameters();
			var sPath = oParams.sortItem.getKey();
			var bDescending = oParams.sortDescending;
			var aSorters = [new Sorter(sPath, bDescending)];

			this.byId("materialTable").getBinding("items").sort(aSorters);
		},

		onRowPress: function (oEvent) {
			var oItem = oEvent.getSource();
			var sMaterialId = oItem.getBindingContext().getProperty("MaterialId");
			this.getRouter().navTo("MaterialDetail", {
				MaterialId: sMaterialId
			});
		},

		onQuickGR: function (oEvent) {
			var oItem = oEvent.getSource();
			var sMaterialId = oItem.getBindingContext().getProperty("MaterialId");
			this.getRouter().navTo("StockList", {
				query: {
					materialId: sMaterialId,
					action: "GR"
				}
			});
		},

		onAddMaterial: function () {
			var oView = this.getView();
			var oFormModel = oView.getModel("formModel");
			oFormModel.setProperty("/materialForm", {
				MaterialId: "", MaterialName: "", MaterialType: "", BaseUnit: "", Plant: "", StorageLocation: "", ValuationClass: ""
			});

			if (!this._oCreateDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "com.sap341.smartwarehouse.fragment.MaterialCreateDialog",
					controller: this
				}).then(function (oDialog) {
					this._oCreateDialog = oDialog;
					oView.addDependent(this._oCreateDialog);
					this._oCreateDialog.open();
					Validator.resetForm(sap.ui.core.Fragment.byId(oView.getId(), "materialCreateForm"));
					// Ensure sloc filter is clear initially
					var oSloc = this.byId("slocComboBox") || sap.ui.core.Fragment.byId(oView.getId(), "slocComboBox");
					if (oSloc && oSloc.getBinding("items")) { oSloc.getBinding("items").filter([]); }
				}.bind(this));
			} else {
				this._oCreateDialog.open();
				Validator.resetForm(sap.ui.core.Fragment.byId(oView.getId(), "materialCreateForm"));
				var oSloc = this.byId("slocComboBox") || sap.ui.core.Fragment.byId(oView.getId(), "slocComboBox");
				if (oSloc && oSloc.getBinding("items")) { oSloc.getBinding("items").filter([]); }
			}
		},

		onSaveMaterial: function () {
			try {
				var oPayload = this.getView().getModel("formModel").getProperty("/materialForm");
				var oForm = sap.ui.core.Fragment.byId(this.getView().getId(), "materialCreateForm");
				if (oForm && !Validator.validateForm(oForm)) {
					this.showMessage(this.getText("msgInputRequired"));
					return;
				}
				if (!oPayload.MaterialId || !oPayload.MaterialName || !oPayload.Plant || !oPayload.StorageLocation) {
					this.showMessage(this.getText("msgInputRequired"));
					return;
				}
				if (!oPayload.ValuationClass) {
					this.showMessage("Error: Valuation Class is required!");
					return;
				}

				// Ép IN HOA cho các mã key SAP
				oPayload.MaterialId       = oPayload.MaterialId.toUpperCase();
				oPayload.Plant            = oPayload.Plant.toUpperCase();
				oPayload.StorageLocation  = oPayload.StorageLocation.toUpperCase();
				oPayload.MaterialType     = oPayload.MaterialType ? oPayload.MaterialType.toUpperCase() : oPayload.MaterialType;
				oPayload.BaseUnit         = oPayload.BaseUnit ? oPayload.BaseUnit.toUpperCase() : oPayload.BaseUnit;
				oPayload.ValuationClass   = oPayload.ValuationClass.toUpperCase();

				this._createMaterial(oPayload);
			} catch (e) {
				this.getView().setBusy(false);
				MessageBox.error((e && e.message) || "Unexpected error while saving material.");
			}
		},

		_createMaterial: function (oPayload) {
			try {
				this.showMessage("Sending create material...");
				this.getView().setBusy(true);
				MaterialService.createMaterial(this._oModel, oPayload)
					.then(function () {
						this.showMessage(this.getText("msgSuccess"));
						this._oCreateDialog.close();
						this.onRefresh();
					}.bind(this))
					.catch(function (oError) {
						MessageBox.error(this.getODataErrorMessage(oError) || this.getText("msgErrorCreate"));
					}.bind(this))
					.finally(function () {
						this.getView().setBusy(false);
					}.bind(this));
			} catch (e) {
				this.getView().setBusy(false);
				MessageBox.error((e && e.message) || "Unexpected error while creating material.");
			}
		},

		onCancelCreate: function () {
			this._oCreateDialog.close();
		},

		onChangePlant: function (oEvent) {
            var sPlant = oEvent.getSource().getSelectedKey();
            var oSlocComboBox = sap.ui.core.Fragment.byId(this.getView().getId(), "slocComboBox");
            var oFormModel = this.getView().getModel("formModel");

            oFormModel.setProperty("/materialForm/StorageLocation", "");

            if (oSlocComboBox) {
                var oBinding = oSlocComboBox.getBinding("items");
                if (oBinding) {
                    oBinding.filter(sPlant ? [new sap.ui.model.Filter("PlantId", sap.ui.model.FilterOperator.EQ, sPlant)] : []);
                }
            }
        },

		onChangeMaterialType: function (oEvent) {
			var sMtart = oEvent.getSource().getSelectedKey();
			var oValClassComboBox = sap.ui.core.Fragment.byId(this.getView().getId(), "valClassComboBox");
			var oFormModel = this.getView().getModel("formModel");

			// Reset valuation class khi đổi loại vật tư
			oFormModel.setProperty("/materialForm/ValuationClass", "");

			if (oValClassComboBox) {
				var oBinding = oValClassComboBox.getBinding("items");
				if (oBinding) {
					oBinding.filter(sMtart
						? [new sap.ui.model.Filter("MaterialType", sap.ui.model.FilterOperator.EQ, sMtart)]
						: []);
				}
			}
		}
	});
});
