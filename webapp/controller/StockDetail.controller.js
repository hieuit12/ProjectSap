sap.ui.define([
    "com/sap341/smartwarehouse/controller/BaseController",
    "com/sap341/smartwarehouse/model/models",
    "com/sap341/smartwarehouse/service/StockService",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../model/formatter",
    "../model/Validator"
], function (BaseController, models, StockService, Fragment, MessageBox, Filter, FilterOperator, formatter, Validator) {
    "use strict";

    return BaseController.extend("com.sap341.smartwarehouse.controller.StockDetail", {
        formatter: formatter,

        onInit: function () {
            this._oModel = this.getOwnerComponent().getModel();
            if (!this.getView().getModel("formModel")) {
                this.getView().setModel(models.createFormModel(), "formModel");
            }
            this.getRouter().getRoute("StockDetail").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var oModel = this._oModel;

            // TẠO KEY CHUẨN ODATA CỦA SAP
            var sPath = oModel.createKey("/StockSet", {
                MaterialId: oArgs.MaterialId,
                Plant: oArgs.Plant,
                StorageLocation: oArgs.StorageLocation
            });

            this.getView().bindElement({
                path: sPath,
                events: {
                    dataRequested: function () { this.getView().setBusy(true); }.bind(this),
                    dataReceived: function (oData) {
                        this.getView().setBusy(false);
                        var oReceivedData = oData.getParameter("data");
                        if (!oReceivedData) {
                            sap.m.MessageToast.show(this.getText("msgErrorNotFound"));
                            this.getRouter().navTo("StockList", {}, true);
                        }
                    }.bind(this)
                }
            });

            this._applyRecentHistoryFilters(oArgs.MaterialId, oArgs.Plant, oArgs.StorageLocation);
        },

        _applyRecentHistoryFilters: function (sMaterialId, sPlant, sSloc) {
            var oTable = this.byId("recentHistoryStockTable");
            if (!oTable) { return; }
            var aFilters = [];
            if (sMaterialId) { aFilters.push(new Filter("MaterialId", FilterOperator.EQ, sMaterialId)); }
            if (sPlant) { aFilters.push(new Filter("Plant", FilterOperator.EQ, sPlant)); }
            if (sSloc) { aFilters.push(new Filter("StorageLocation", FilterOperator.EQ, sSloc)); }

            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.filter(aFilters);
            } else {
                oTable.attachEventOnce("updateFinished", function () {
                    var oB = oTable.getBinding("items");
                    if (oB) { oB.filter(aFilters); }
                });
            }
        },

        onViewAllHistory: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            this.getRouter().navTo("History", {
                "?query": {
                    materialId: oCtx.getProperty("MaterialId"),
                    plant: oCtx.getProperty("Plant"),
                    sloc: oCtx.getProperty("StorageLocation")
                }
            });
        },

        // Nhảy sang màn hình Stock List và tự động mở Dialog Nhập Kho
        onActionGR: function () {
            var oCtx = this.getView().getBindingContext();
            this.getRouter().navTo("StockList", {
                "?query": {
                    materialId: oCtx.getProperty("MaterialId"),
                    plant: oCtx.getProperty("Plant"),
                    sloc: oCtx.getProperty("StorageLocation"),
                    action: "GR"
                }
            });
        },

        // Tái sử dụng Dialog Update Stock giống bên StockList
        onUpdateStock: function () {
            var oCtx = this.getView().getBindingContext();
            var oModel = this.getView().getModel("formModel");

            // Clone data ra model tạm để bind vào form chỉnh sửa
            oModel.setProperty("/stockForm", Object.assign({}, oCtx.getObject()));

            if (!this._oUpdateDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.sap341.smartwarehouse.fragment.UpdateStockDialog",
                    controller: this // Dùng controller này để handle logic Save
                }).then(function (oDialog) {
                    this._oUpdateDialog = oDialog;
                    this.getView().addDependent(oDialog);
                    this._oUpdateDialog.open();
                }.bind(this));
            } else {
                this._oUpdateDialog.open();
            }
        },

        onConfirmUpdateStock: function () {
            var oForm = sap.ui.core.Fragment.byId(this.getView().getId(), "updateStockForm");
            if (!Validator.validateForm(oForm)) {
                this.showMessage(this.getText("msgValidation"));
                return;
            }
            var oData = this.getView().getModel("formModel").getProperty("/stockForm");

            // Ép IN HOA cho mã key SAP (bắt buộc với ABAP Dictionary)
            oData.MaterialId      = oData.MaterialId      ? oData.MaterialId.toUpperCase()      : oData.MaterialId;
            oData.Plant           = oData.Plant           ? oData.Plant.toUpperCase()           : oData.Plant;
            oData.StorageLocation = oData.StorageLocation ? oData.StorageLocation.toUpperCase() : oData.StorageLocation;

            this.getView().setBusy(true);

            StockService.updateStock(this._oModel, oData)
                .then(function () {
                    this.showMessage(this.getText("msgSuccess"));
                    this._oUpdateDialog.close();
                    this.getView().getElementBinding().refresh(); // Refresh lại data hiện tại
                }.bind(this))
                .catch(function () {
                    var oError = arguments && arguments[0];
                    MessageBox.error(this.getODataErrorMessage(oError) || this.getText("msgErrorUpdate"));
                }.bind(this))
                .finally(function () {
                    this.getView().setBusy(false);
                }.bind(this));
        },

        onCancelUpdateStock: function () {
            if (this._oUpdateDialog) {
                this._oUpdateDialog.close();
            }
        }
    });
});