sap.ui.define([
    "com/sap341/smartwarehouse/controller/BaseController",
    "com/sap341/smartwarehouse/model/formatter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, formatter, JSONModel, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("com.sap341.smartwarehouse.controller.Dashboard", {
        formatter: formatter,

        onInit: function () {
            var oChartModel = new JSONModel({
                title: "",
                vizType: "column",
                points: []
            });
            this.getView().setModel(oChartModel, "dashboardChart");

            // Model cho Low Stock Alert table
            var oLowStockModel = new JSONModel({ items: [], hasData: false, countText: "" });
            this.getView().setModel(oLowStockModel, "lowStockModel");

            this.getRouter().getRoute("Dashboard").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oView = this.getView();
            oView.bindElement("/DashboardKPISet('1')");
            oView.getModel().refresh();
            // Load Low Stock Alert sau 500ms để KPI load trước
            setTimeout(this._loadLowStockItems.bind(this), 500);
        },

        /**
         * Tải danh sách vật tư có tồn kho thấp (labst <= 10) từ StockSet
         * Không cần thay đổi BE: lọc client-side sau khi lấy dữ liệu
         */
        _loadLowStockItems: function () {
            var oModel    = this.getView().getModel();
            var oLowModel = this.getView().getModel("lowStockModel");

            oModel.read("/StockSet", {
                success: function (oData) {
                    var aLow = (oData.results || []).filter(function (oRow) {
                        return parseFloat(oRow.Quantity) <= 10;
                    });
                    aLow.sort(function (a, b) {
                        return parseFloat(a.Quantity) - parseFloat(b.Quantity);
                    });
                    oLowModel.setData({
                        items:     aLow,
                        hasData:   aLow.length > 0,
                        countText: aLow.length + " items with low stock (≤ 10)"
                    });
                },
                error: function () {
                    oLowModel.setData({ items: [], hasData: false, countText: "" });
                }
            });
        },

        onShowKpiChart: function (oEvent) {
            var sKpi = oEvent.getSource().data("kpi");
            if (sKpi === "CATALOG_SIZE") {
                this._buildCatalogSizeChart();
            } else if (sKpi === "TOTAL_STOCK") {
                this._buildStockByPlantChart();
            } else if (sKpi === "CRITICAL_ITEMS") {
                this._buildCriticalItemsChart();
            } else if (sKpi === "ACTIVE_SITES") {
                this._buildActiveSitesChart();
            } else {
                return;
            }
            this.byId("kpiChartDialog").open();
        },

        onCloseKpiChart: function () {
            this.byId("kpiChartDialog").close();
        },

        _buildCatalogSizeChart: function () {
            var oModel = this.getView().getModel();
            var oChartModel = this.getView().getModel("dashboardChart");
            oModel.read("/MaterialSet", {
                success: function (oData) {
                    var mAgg = {};
                    (oData.results || []).forEach(function (oRow) {
                        var sType = oRow.MaterialType || "UNKNOWN";
                        mAgg[sType] = (mAgg[sType] || 0) + 1;
                    });
                    var aPoints = Object.keys(mAgg)
                        .map(function (sType) { return { Dim: sType, Value: mAgg[sType] }; })
                        .sort(function (a, b) { return b.Value - a.Value; })
                        .slice(0, 5);  // Top 5 loại vật tư nhiều nhất
                    oChartModel.setData({ title: "Catalog Size by Material Type", vizType: "column", points: aPoints });
                }
            });
        },

        _buildStockByPlantChart: function () {
            var oModel = this.getView().getModel();
            var oChartModel = this.getView().getModel("dashboardChart");
            oModel.read("/StockSet", {
                success: function (oData) {
                    var mAgg = {};
                    (oData.results || []).forEach(function (oRow) {
                        if (!oRow.Plant) { return; }
                        mAgg[oRow.Plant] = (mAgg[oRow.Plant] || 0) + (parseFloat(oRow.Quantity) || 0);
                    });
                    var aPoints = Object.keys(mAgg)
                        .map(function (s) { return { Dim: s, Value: mAgg[s] }; })
                        .sort(function (a, b) { return b.Value - a.Value; })
                        .slice(0, 5);  // Top 5 Plant tồn kho nhiều nhất
                    oChartModel.setData({ title: "Total Stock by Plant", vizType: "column", points: aPoints });
                }
            });
        },

        _buildCriticalItemsChart: function () {
            var oModel = this.getView().getModel();
            var oChartModel = this.getView().getModel("dashboardChart");
            oModel.read("/StockSet", {
                success: function (oData) {
                    // Lấy top 15 vật tư có tồn kho thấp nhất (<=10) để chart dễ đọc
                    var aLow = (oData.results || [])
                        .filter(function (r) { return parseFloat(r.Quantity) <= 10; })
                        .sort(function (a, b) { return parseFloat(a.Quantity) - parseFloat(b.Quantity); })
                        .slice(0, 15);
                    // Nhóm theo Plant: đếm số vật tư tồn kho thấp mỗi Plant
                    var mByPlant = {};
                    (oData.results || []).filter(function (r) {
                        return parseFloat(r.Quantity) <= 10;
                    }).forEach(function (r) {
                        if (!r.Plant) { return; }
                        mByPlant[r.Plant] = (mByPlant[r.Plant] || 0) + 1;
                    });
                    var aPoints = Object.keys(mByPlant)
                        .map(function (s) { return { Dim: s, Value: mByPlant[s] }; })
                        .sort(function (a, b) { return b.Value - a.Value; })
                        .slice(0, 5);
                    oChartModel.setData({ title: "Low Stock Items by Plant", vizType: "bar", points: aPoints });
                }
            });
        },

        _buildActiveSitesChart: function () {
            var oModel = this.getView().getModel();
            var oChartModel = this.getView().getModel("dashboardChart");
            oModel.read("/StockSet", {
                success: function (oData) {
                    var mAgg = {};
                    (oData.results || []).forEach(function (oRow) {
                        if (!oRow.Plant) { return; }
                        mAgg[oRow.Plant] = (mAgg[oRow.Plant] || 0) + 1;
                    });
                    var aPoints = Object.keys(mAgg)
                        .map(function (s) { return { Dim: s, Value: mAgg[s] }; })
                        .sort(function (a, b) { return b.Value - a.Value; })
                        .slice(0, 5);  // Top 5 Plant có nhiều SLoc nhất
                    oChartModel.setData({ title: "Active Sites by Plant", vizType: "donut", points: aPoints });
                }
            });
        },

        onNavToMaterialList: function () { this.getRouter().navTo("MaterialList"); },
        onNavToStockList:    function () { this.getRouter().navTo("StockList"); },
        onNavToHistory:      function () { this.getRouter().navTo("History"); },

        /**
         * Click vào Low Stock Item → Navigate to Material Detail
         */
        onLowStockItemPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oCtx = oItem.getBindingContext("lowStockModel");
            var sMaterialId = oCtx.getProperty("MaterialId");
            
            if (sMaterialId) {
                this.getRouter().navTo("MaterialDetail", {
                    MaterialId: sMaterialId
                });
            }
        },

        /**
         * Click vào Recent History Item → Navigate to History with Material filter
         */
        onRecentHistoryPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oCtx = oItem.getBindingContext();
            var sMaterialId = oCtx.getProperty("MaterialId");
            
            if (sMaterialId) {
                // Navigate to History page
                this.getRouter().navTo("History");
                
                // Set filter sau khi navigate (delay nhỏ để page load xong)
                setTimeout(function() {
                    var oHistoryView = this.getOwnerComponent().getRootControl().byId("GoodsReceiptHistory");
                    if (oHistoryView) {
                        var oController = oHistoryView.getController();
                        if (oController && oController.byId("filterMaterial")) {
                            oController.byId("filterMaterial").setValue(sMaterialId);
                            oController.onSearch();
                        }
                    }
                }.bind(this), 300);
            }
        }
    });
});