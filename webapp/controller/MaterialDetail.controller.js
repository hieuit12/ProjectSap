sap.ui.define([
    "com/sap341/smartwarehouse/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../model/formatter"
], function (BaseController, JSONModel, Filter, FilterOperator, formatter) {
    "use strict";

    return BaseController.extend("com.sap341.smartwarehouse.controller.MaterialDetail", {
        formatter: formatter,

        onInit: function () {
            this.getView().setModel(new JSONModel({
                TotalQty: "0.000",
                TotalPlants: 0,
                TotalSlocs: 0
            }), "materialSummary");
            this.getRouter().getRoute("MaterialDetail").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var sMaterialId = oEvent.getParameter("arguments").MaterialId;
            var oModel = this.getOwnerComponent().getModel();

            // TẠO KEY CHUẨN
            var sPath = oModel.createKey("/MaterialSet", {
                MaterialId: sMaterialId
            });

            this.getView().bindElement({
                path: sPath,
                events: {
                    dataRequested: function () { this.getView().setBusy(true); }.bind(this),
                    dataReceived: function () { this.getView().setBusy(false); }.bind(this)
                }
            });

            // Lọc 2 bảng con bên trong Detail
            this._applySubTableFilters(sMaterialId);
            this._loadStockSummary(sMaterialId);
        },

        _loadStockSummary: function (sMaterialId) {
            var oModel = this.getOwnerComponent().getModel();
            var oSummary = this.getView().getModel("materialSummary");
            oSummary.setProperty("/TotalQty", "0.000");
            oSummary.setProperty("/TotalPlants", 0);
            oSummary.setProperty("/TotalSlocs", 0);

            var aFilters = [new Filter("MaterialId", FilterOperator.EQ, sMaterialId)];
            oModel.read("/StockSet", {
                filters: aFilters,
                success: function (oData) {
                    var a = (oData && oData.results) || [];
                    var fTotal = 0;
                    var mPlants = {};
                    var mSlocs = {};
                    a.forEach(function (r) {
                        var f = parseFloat(r.Quantity || 0);
                        if (!isNaN(f)) {
                            fTotal += f;
                        }
                        if (r.Plant) {
                            mPlants[r.Plant] = true;
                        }
                        if (r.Plant && r.StorageLocation) {
                            mSlocs[r.Plant + "|" + r.StorageLocation] = true;
                        }
                    });
                    oSummary.setProperty("/TotalQty", fTotal.toFixed(3));
                    oSummary.setProperty("/TotalPlants", Object.keys(mPlants).length);
                    oSummary.setProperty("/TotalSlocs", Object.keys(mSlocs).length);
                }.bind(this),
                error: function () {
                    // keep defaults; detailed errors handled globally
                }
            });
        },

        _applySubTableFilters: function (sMaterialId) {
            var aFilters = [new Filter("MaterialId", FilterOperator.EQ, sMaterialId)];

            var oStockTable = this.byId("stockTableDetail");
            if (oStockTable) {
                var oStockBinding = oStockTable.getBinding("items");
                if (oStockBinding) {
                    oStockBinding.filter(aFilters);
                } else {
                    oStockTable.attachEventOnce("updateFinished", function () {
                        var oB = oStockTable.getBinding("items");
                        if (oB) { oB.filter(aFilters); }
                    });
                }
            }

            var oHistoryTable = this.byId("historyTableDetail");
            if (oHistoryTable) {
                var oHistBinding = oHistoryTable.getBinding("items");
                if (oHistBinding) {
                    oHistBinding.filter(aFilters);
                } else {
                    oHistoryTable.attachEventOnce("updateFinished", function () {
                        var oB = oHistoryTable.getBinding("items");
                        if (oB) { oB.filter(aFilters); }
                    });
                }
            }
        },

        onNavToStockDetail: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            this.getRouter().navTo("StockDetail", {
                MaterialId: oCtx.getProperty("MaterialId"),
                Plant: oCtx.getProperty("Plant"),
                StorageLocation: oCtx.getProperty("StorageLocation")
            });
        },

        onQuickGR: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            this.getRouter().navTo("StockList", {
                "?query": {
                    materialId: oCtx.getProperty("MaterialId"),
                    action: "GR"
                }
            });
        },

        onGoToStock: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            this.getRouter().navTo("StockList", {
                "?query": {
                    materialId: oCtx.getProperty("MaterialId")
                }
            });
        },

        onViewAllHistory: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            this.getRouter().navTo("History", {
                "?query": {
                    materialId: oCtx.getProperty("MaterialId")
                }
            });
        },

        onRefresh: function () {
            this.getView().getElementBinding().refresh();
            var oCtx = this.getView().getBindingContext();
            if (oCtx) {
                this._loadStockSummary(oCtx.getProperty("MaterialId"));
            }
        },

        onNavBack: function () {
            this.getRouter().navTo("MaterialList", {}, true);
        }
    });
});