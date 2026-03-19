sap.ui.define([
	"com/sap341/smartwarehouse/controller/BaseController",
	"com/sap341/smartwarehouse/model/models",
	"com/sap341/smartwarehouse/service/StockService",
	"com/sap341/smartwarehouse/service/GoodsReceiptService",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"../model/formatter",
	"../model/Validator"
], function (BaseController, models, StockService, GoodsReceiptService, MessageBox, MessageToast, Fragment, Filter, FilterOperator, Sorter, formatter, Validator) {
	"use strict";

	return BaseController.extend("com.sap341.smartwarehouse.controller.StockList", {
		formatter: formatter,

		onInit: function () {
			this._oModel = this.getOwnerComponent().getModel();
			this.getView().setModel(models.createAppViewModel(), "appView");
			this.getView().setModel(models.createFormModel(), "formModel");

			this.getRouter().getRoute("StockList").attachPatternMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");
			var oQuery = oArgs["?query"];
			if (oQuery && oQuery.materialId) {
				this.byId("searchStockField").setValue(oQuery.materialId);
				if (oQuery.plant) { this.byId("plantFilter").setSelectedKey(oQuery.plant); }
				if (oQuery.sloc) { this.byId("slocFilter").setSelectedKey(oQuery.sloc); }
				this._applyFilters();
				if (oQuery.action === "GR") { this.onGoodsReceipt(); }
			} else {
				this._applyFilters();
			}
		},

		onRefresh: function () {
			this._oModel.refresh();
		},

		onSearchStock: function () {
			this._applyFilters();
		},

		onFilterStock: function () {
			this._applyFilters();
		},

		onResetFilters: function () {
			this.byId("searchStockField").setValue("");
			this.byId("plantFilter").setSelectedKey("");
			this.byId("slocFilter").setSelectedKey("");
			var oSlocBinding = this.byId("slocFilter").getBinding("items");
			if (oSlocBinding) {
				oSlocBinding.filter([]);
			}
			this._applyFilters();
			this.showMessage(this.getText("msgFiltersReset"));
		},

		_applyFilters: function () {
			var sMat = this.byId("searchStockField").getValue();
			var sPlant = this.byId("plantFilter").getSelectedKey();
			var sSloc = this.byId("slocFilter").getSelectedKey();
			var aFilters = [];

			if (sMat) { 
				sMat = sMat.toUpperCase();
				// BE StockSet chỉ parse filter theo MaterialId, rồi tự apply cho cả ID/Name (MATNR/MAKTX)
				aFilters.push(new Filter("MaterialId", FilterOperator.Contains, sMat));
			}
			if (sPlant) { aFilters.push(new Filter("Plant", FilterOperator.EQ, sPlant)); }
			if (sSloc) { aFilters.push(new Filter("StorageLocation", FilterOperator.EQ, sSloc)); }

			var oBinding = this.byId("stockTable").getBinding("items");
			oBinding.filter(aFilters);
			this._updateTotalSummary();
		},

		_updateTotalSummary: function () {
			var oTable = this.byId("stockTable");
			var oBinding = oTable.getBinding("items");
			if (!oBinding) { return; }
			
			// Use a small delay to ensure binding data is available
			setTimeout(function() {
				var aContexts = oBinding.getContexts(0, 1000);
				var fTotal = aContexts.reduce(function (sum, oCtx) {
					return sum + parseFloat(oCtx.getProperty("Quantity") || 0);
				}, 0);
				this.byId("totalStockStatus").setText(fTotal.toFixed(3));
			}.bind(this), 100);
		},

		onGroupByPlant: function () {
			var oBinding = this.byId("stockTable").getBinding("items");
			var bGrouped = oBinding.aSorters.some(function (s) { return s.vGroup; });
			oBinding.sort(new Sorter("Plant", !bGrouped, true));
		},

		onStockDetail: function (oEvent) {
			var oCtx = oEvent.getSource().getBindingContext();
			this.getRouter().navTo("StockDetail", {
				MaterialId: oCtx.getProperty("MaterialId"),
				Plant: oCtx.getProperty("Plant"),
				StorageLocation: oCtx.getProperty("StorageLocation")
			});
		},

		onUpdateStock: function (oEvent) {
			var oCtx = (oEvent.getSource().getBindingContext());
			this.getView().getModel("formModel").setProperty("/stockForm", Object.assign({}, oCtx.getObject()));
			if (!this._oUpdateDialog) {
				Fragment.load({ id: this.getView().getId(), name: "com.sap341.smartwarehouse.fragment.UpdateStockDialog", controller: this })
					.then(function (oDialog) { this._oUpdateDialog = oDialog; this.getView().addDependent(oDialog); oDialog.open(); }.bind(this));
			} else { this._oUpdateDialog.open(); }
		},

		onConfirmUpdateStock: function () {
			try {
				var oForm = sap.ui.core.Fragment.byId(this.getView().getId(), "updateStockForm");
				if (!Validator.validateForm(oForm)) {
					this.showMessage(this.getText("msgValidation"));
					return;
				}
				var oData = this.getView().getModel("formModel").getProperty("/stockForm");

				// Ép IN HOA cho mã key SAP (Lỗi 3 fix)
				oData.MaterialId      = oData.MaterialId ? oData.MaterialId.toUpperCase() : oData.MaterialId;
				oData.Plant           = oData.Plant ? oData.Plant.toUpperCase() : oData.Plant;
				oData.StorageLocation = oData.StorageLocation ? oData.StorageLocation.toUpperCase() : oData.StorageLocation;

				MessageBox.confirm(this.getText("confirmUpdate"), {
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.OK) {
							this.showMessage("Sending update stock...");
							this.getView().setBusy(true);
							StockService.updateStock(this._oModel, oData)
								.then(function () {
									this.showMessage(this.getText("msgSuccess"));
									this._oUpdateDialog.close();
									this._oModel.refresh();
								}.bind(this))
								.catch(function (err) {
									MessageBox.error(this.getODataErrorMessage(err) || this.getText("msgErrorUpdate"));
								}.bind(this))
								.finally(function () {
									this.getView().setBusy(false);
								}.bind(this));
						}
					}.bind(this)
				});
			} catch (e) {
				this.getView().setBusy(false);
				MessageBox.error((e && e.message) || "Unexpected error while updating stock.");
			}
		},

		onCancelUpdateStock: function () { this._oUpdateDialog.close(); },

		onGoodsReceipt: function () {
			var sMatId = this.byId("searchStockField").getValue();
			var sPlant = this.byId("plantFilter").getSelectedKey();
			var sSloc = this.byId("slocFilter").getSelectedKey();
			
			this.getView().getModel("formModel").setProperty("/goodsReceiptForm", {
				MaterialId: sMatId, 
				Plant: sPlant, 
				StorageLocation: sSloc, 
				Quantity: 1, 
				PostingDate: new Date(), 
				DocumentDate: new Date()
			});

			if (!this._oGRDialog) {
				Fragment.load({ 
					id: this.getView().getId(), 
					name: "com.sap341.smartwarehouse.fragment.GoodsReceiptDialog", 
					controller: this 
				}).then(function (oDialog) { 
					this._oGRDialog = oDialog; 
					this.getView().addDependent(oDialog); 
					oDialog.open(); 
					Validator.resetForm(sap.ui.core.Fragment.byId(this.getView().getId(), "goodsReceiptForm"));
					// Apply initial filter if plant is pre-selected
					if (sPlant) {
						var oSlocComboBox = sap.ui.core.Fragment.byId(this.getView().getId(), "grSLocComboBox");
						if (oSlocComboBox && oSlocComboBox.getBinding("items")) {
							oSlocComboBox.getBinding("items").filter([new Filter("PlantId", FilterOperator.EQ, sPlant)]);
						}
					}
				}.bind(this));
			} else { 
				this._oGRDialog.open(); 
				Validator.resetForm(sap.ui.core.Fragment.byId(this.getView().getId(), "goodsReceiptForm"));
				// Apply initial filter if plant is pre-selected
				if (sPlant) {
					var oSlocComboBox2 = sap.ui.core.Fragment.byId(this.getView().getId(), "grSLocComboBox");
					if (oSlocComboBox2 && oSlocComboBox2.getBinding("items")) {
						oSlocComboBox2.getBinding("items").filter([new Filter("PlantId", FilterOperator.EQ, sPlant)]);
					}
				}
			}
		},

		onConfirmGoodsReceipt: function () {
			try {
				var oForm = sap.ui.core.Fragment.byId(this.getView().getId(), "goodsReceiptForm");
				if (!Validator.validateForm(oForm)) {
					this.showMessage(this.getText("msgInputRequired"));
					return;
				}
				var oData = this.getView().getModel("formModel").getProperty("/goodsReceiptForm");

				// Ép IN HOA cho mã key SAP (Lỗi 2 fix)
				oData.MaterialId      = oData.MaterialId ? oData.MaterialId.toUpperCase() : oData.MaterialId;
				oData.Plant           = oData.Plant ? oData.Plant.toUpperCase() : oData.Plant;
				oData.StorageLocation = oData.StorageLocation ? oData.StorageLocation.toUpperCase() : oData.StorageLocation;

				this.showMessage("Sending goods receipt...");
				this.getView().setBusy(true);
				GoodsReceiptService.postGoodsReceipt(this._oModel, oData)
					.then(function (res) {
						MessageBox.success(this.getText("msgSuccessGR", [res.MaterialDocument]));
						this._oGRDialog.close();
						this.onRefresh();
					}.bind(this))
					.catch(function (err) {
						MessageBox.error(this.getODataErrorMessage(err) || this.getText("msgErrorGR"));
					}.bind(this))
					.finally(function () {
						this.getView().setBusy(false);
					}.bind(this));
			} catch (e) {
				this.getView().setBusy(false);
				MessageBox.error((e && e.message) || "Unexpected error while sending Goods Receipt.");
			}
		},

		onCancelGoodsReceipt: function () { this._oGRDialog.close(); },

		onChangePlant: function (oEvent) {
            var sPlant = oEvent.getSource().getSelectedKey();
            var oSlocComboBox = sap.ui.core.Fragment.byId(this.getView().getId(), "grSLocComboBox");
            var oFormModel = this.getView().getModel("formModel");

            oFormModel.setProperty("/goodsReceiptForm/StorageLocation", "");

            if (oSlocComboBox) {
                var oBinding = oSlocComboBox.getBinding("items");
                if (oBinding) {
                    oBinding.filter(sPlant ? [new sap.ui.model.Filter("PlantId", sap.ui.model.FilterOperator.EQ, sPlant)] : []);
                }
            }
        },

		onFilterPlantChange: function (oEvent) {
			var sPlant = oEvent.getSource().getSelectedKey();
			var oSlocFilter = this.byId("slocFilter");
			
			// Clear sloc filter
			oSlocFilter.setSelectedKey("");
			
			// Filter sloc items
			var oBinding = oSlocFilter.getBinding("items");
			if (oBinding) {
				oBinding.filter(sPlant ? [new Filter("PlantId", FilterOperator.EQ, sPlant)] : []);
			} else {
				// Fallback if binding is not ready
				oSlocFilter.bindAggregation("items", {
					path: "/StorageLocationMasterSet",
					template: new sap.ui.core.Item({ key: "{StorageLocationId}", text: "{StorageLocationId} - {StorageLocationName}" }),
					filters: sPlant ? [new Filter("PlantId", FilterOperator.EQ, sPlant)] : []
				});
			}
			
			// Apply filters to table
			this._applyFilters();
		},

		onExportExcel: function () {
			var oBinding = this.byId("stockTable").getBinding("items");
			var aContexts = oBinding ? oBinding.getContexts(0, 9999) : [];

			if (!aContexts.length) {
				sap.m.MessageToast.show("Không có dữ liệu để xuất!");
				return;
			}

			var aData = aContexts.map(function (oCtx) {
				var o = oCtx.getObject();
				return {
					MaterialId:      o.MaterialId      || "",
					MaterialName:    o.MaterialName    || "",
					Plant:           o.Plant           || "",
					StorageLocation: o.StorageLocation || "",
					Quantity:        parseFloat(o.Quantity)  || 0,
					BaseUnit:        o.BaseUnit        || ""
				};
			});

			sap.ui.require(["sap/ui/export/Spreadsheet"], function (Spreadsheet) {
				var oSettings = {
					workbook: {
						columns: [
							{ label: "Material ID",       property: "MaterialId",      type: "String" },
							{ label: "Material Name",     property: "MaterialName",    type: "String" },
							{ label: "Plant",             property: "Plant",           type: "String" },
							{ label: "Storage Location",  property: "StorageLocation", type: "String" },
							{ label: "Quantity",          property: "Quantity",        type: "Number" },
							{ label: "Base Unit",         property: "BaseUnit",        type: "String" }
						],
						context: { sheetName: "Stock List" }
					},
					dataSource: aData,
					fileName: "StockList_" + new Date().toISOString().slice(0, 10) + ".xlsx"
				};
				new Spreadsheet(oSettings).build().then(function () {
					sap.m.MessageToast.show("Xuất Excel thành công!");
				});
			});
		}
	});
});
