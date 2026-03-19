sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../model/formatter",
    "./BaseController",
    "sap/ui/core/Fragment",
    "sap/ui/core/format/DateFormat"
], function (Filter, FilterOperator, formatter, BaseController, Fragment, DateFormat) {
    "use strict";

    return BaseController.extend("com.sap341.smartwarehouse.controller.GoodsReceiptHistory", {
        formatter: formatter,

        onInit: function () {
            // Khởi tạo model lưu data cho chi tiết History
            this.getView().setModel(new sap.ui.model.json.JSONModel(), "historyDetailModel");
        },

        onSearch: function () {
            var sMatId = this.byId("filterMaterial").getValue();
            var sPlant = this.byId("filterPlant").getSelectedKey();
            var sSLoc = this.byId("filterStorageLocation").getSelectedKey();
            var dPostingFrom = this._getDateFromPicker("filterPostingFromDate");
            var dPostingTo = this._getDateFromPicker("filterPostingToDate");
            var dDocFrom = this._getDateFromPicker("filterDocumentFromDate");
            var dDocTo = this._getDateFromPicker("filterDocumentToDate");
            var aFilters = [];

            if (sMatId) {
                sMatId = sMatId.toUpperCase();
                aFilters.push(new Filter("MaterialId", FilterOperator.Contains, sMatId));
            }
            if (sPlant) {
                aFilters.push(new Filter("Plant", FilterOperator.EQ, sPlant));
            }
            if (sSLoc) {
                aFilters.push(new Filter("StorageLocation", FilterOperator.EQ, sSLoc));
            }

            // Date range filter (server-side) — FIX TIMEZONE: wrap bằng _toUtcNoon()
            if (dPostingFrom || dPostingTo) {
                var dFrom = dPostingFrom ? this._toUtcNoon(dPostingFrom) : null;
                var dTo   = dPostingTo   ? this._toUtcNoon(dPostingTo)   : null;
                if (dFrom && dTo) {
                    aFilters.push(new Filter("PostingDate", FilterOperator.BT, dFrom, dTo));
                } else if (dFrom) {
                    aFilters.push(new Filter("PostingDate", FilterOperator.GE, dFrom));
                } else if (dTo) {
                    aFilters.push(new Filter("PostingDate", FilterOperator.LE, dTo));
                }
            }

            if (dDocFrom || dDocTo) {
                var dDFrom = dDocFrom ? this._toUtcNoon(dDocFrom) : null;
                var dDTo   = dDocTo   ? this._toUtcNoon(dDocTo)   : null;
                if (dDFrom && dDTo) {
                    aFilters.push(new Filter("DocumentDate", FilterOperator.BT, dDFrom, dDTo));
                } else if (dDFrom) {
                    aFilters.push(new Filter("DocumentDate", FilterOperator.GE, dDFrom));
                } else if (dDTo) {
                    aFilters.push(new Filter("DocumentDate", FilterOperator.LE, dDTo));
                }
            }

            var oBinding = this.byId("historyTable").getBinding("items");
            if (oBinding) {
                oBinding.filter(aFilters);
            }
        },

        _getDateFromPicker: function (sId) {
            var oDP = this.byId(sId);
            if (!oDP) {
                return null;
            }

            var d = oDP.getDateValue && oDP.getDateValue();
            if (d instanceof Date && !isNaN(d.getTime())) {
                return d;
            }

            // Fallback: parse displayed value (dd/MM/yyyy) or valueFormat (yyyy-MM-dd)
            var sVal = oDP.getValue && oDP.getValue();
            if (!sVal) {
                return null;
            }

            var oFmtDMY = DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" });
            var oFmtYMD = DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
            var d1 = oFmtDMY.parse(sVal) || oFmtYMD.parse(sVal);
            if (d1 instanceof Date && !isNaN(d1.getTime())) {
                return d1;
            }
            return null;
        },

        /**
         * FIX TIMEZONE: Bù trừ UTC offset để ngày gửi lên SAP BE không bị lùi 1 ngày.
         * Ví dụ GMT+7: 19/03 00:00 local = 18/03 17:00 UTC → BE nhận sai ngày.
         * Giải pháp: đặt giờ về 12:00 trưa UTC (noon) → luôn rơi đúng ngày local.
         */
        _toUtcNoon: function (oDate) {
            if (!oDate || !(oDate instanceof Date)) { return oDate; }
            // Lấy năm/tháng/ngày theo giờ ĐỊA PHƯƠNG của người dùng
            var y = oDate.getFullYear();
            var m = oDate.getMonth();
            var d = oDate.getDate();
            // Tạo Date mới tại 12:00 UTC = tương đương 19:00 GMT+7
            // → SAP cắt chuỗi ISO lấy phần ngày sẽ luôn đúng
            return new Date(Date.UTC(y, m, d, 12, 0, 0));
        },

        onPlantChange: function (oEvent) {
            var sPlant = oEvent.getSource().getSelectedKey();
            var oSlocComboBox = this.byId("filterStorageLocation");
            
            // Xóa Sloc đã chọn cũ
            oSlocComboBox.setSelectedKey("");
            
            // Lọc danh sách Sloc theo Plant
            if (oSlocComboBox) {
                var oBinding = oSlocComboBox.getBinding("items");
                if (oBinding) {
                    oBinding.filter(sPlant ? [new Filter("PlantId", FilterOperator.EQ, sPlant)] : []);
                }
            }
            this.onSearch();
        },

        onReset: function () {
            this.byId("filterMaterial").setValue("");
            this.byId("filterPlant").setSelectedKey("");
            this.byId("filterStorageLocation").setSelectedKey("");
            if (this.byId("filterPostingFromDate")) { this.byId("filterPostingFromDate").setDateValue(null); this.byId("filterPostingFromDate").setValue(""); }
            if (this.byId("filterPostingToDate")) { this.byId("filterPostingToDate").setDateValue(null); this.byId("filterPostingToDate").setValue(""); }
            if (this.byId("filterDocumentFromDate")) { this.byId("filterDocumentFromDate").setDateValue(null); this.byId("filterDocumentFromDate").setValue(""); }
            if (this.byId("filterDocumentToDate")) { this.byId("filterDocumentToDate").setDateValue(null); this.byId("filterDocumentToDate").setValue(""); }
            var oBinding = this.byId("filterStorageLocation").getBinding("items");
            if (oBinding) {
                oBinding.filter([]);
            }
            this.onSearch();
        },

        onRefresh: function () {
            this.getView().byId("historyTable").getBinding("items").refresh();
        },

        // Mở popup xem toàn bộ 12 fields của chứng từ
        onOpenHistoryDetail: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            var oData = oCtx.getObject();

            // Normalize một số field name để popup luôn có đủ dữ liệu (phòng trường hợp property khác casing)
            var oDetail = Object.assign({}, oData);
            if (!oDetail.Year && oDetail.PostingYear) { oDetail.Year = oDetail.PostingYear; }
            if (!oDetail.Year && oDetail.posting_year) { oDetail.Year = oDetail.posting_year; }

            this.getView().getModel("historyDetailModel").setData(oDetail);

            if (!this._oHistoryDetailDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.sap341.smartwarehouse.fragment.HistoryDetailDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oHistoryDetailDialog = oDialog;
                    this.getView().addDependent(this._oHistoryDetailDialog);
                    this._oHistoryDetailDialog.open();
                }.bind(this));
            } else {
                this._oHistoryDetailDialog.open();
            }
        },

        onCloseHistoryDetail: function () {
            if (this._oHistoryDetailDialog) {
                this._oHistoryDetailDialog.close();
            }
        },

        onNavBack: function () {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("Dashboard", {}, true);
            }
        },

        onExportExcel: function () {
            var oBinding = this.byId("historyTable").getBinding("items");
            var aContexts = oBinding ? oBinding.getContexts(0, 9999) : [];

            if (!aContexts.length) {
                sap.m.MessageToast.show("Không có dữ liệu để xuất!");
                return;
            }

            var oFmt = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" });
            var aData = aContexts.map(function (oCtx) {
                var o = oCtx.getObject();
                return {
                    MaterialDocument: o.MaterialDocument || "",
                    Year:             o.Year             || "",
                    PostingDate:      o.PostingDate  ? oFmt.format(o.PostingDate)  : "",
                    DocumentDate:     o.DocumentDate ? oFmt.format(o.DocumentDate) : "",
                    MaterialId:       o.MaterialId       || "",
                    MaterialName:     o.MaterialName      || "",
                    Plant:            o.Plant             || "",
                    StorageLocation:  o.StorageLocation   || "",
                    MovementType:     o.MovementType      || "",
                    Quantity:         parseFloat(o.Quantity) || 0,
                    BaseUnit:         o.BaseUnit           || "",
                    Status:           o.Status             || "",
                    Remark:           o.Remark             || ""
                };
            });

            sap.ui.require(["sap/ui/export/Spreadsheet"], function (Spreadsheet) {
                var oSettings = {
                    workbook: {
                        columns: [
                            { label: "Material Doc",     property: "MaterialDocument", type: "String" },
                            { label: "Year",             property: "Year",             type: "String" },
                            { label: "Posting Date",     property: "PostingDate",      type: "String" },
                            { label: "Document Date",    property: "DocumentDate",     type: "String" },
                            { label: "Material ID",      property: "MaterialId",       type: "String" },
                            { label: "Material Name",    property: "MaterialName",     type: "String" },
                            { label: "Plant",            property: "Plant",            type: "String" },
                            { label: "Storage Loc",      property: "StorageLocation",  type: "String" },
                            { label: "Mvt Type",         property: "MovementType",     type: "String" },
                            { label: "Quantity",         property: "Quantity",         type: "Number" },
                            { label: "Unit",             property: "BaseUnit",         type: "String" },
                            { label: "Status",           property: "Status",           type: "String" },
                            { label: "Remark",           property: "Remark",           type: "String" }
                        ],
                        context: { sheetName: "Transaction History" }
                    },
                    dataSource: aData,
                    fileName: "History_" + new Date().toISOString().slice(0, 10) + ".xlsx"
                };
                new Spreadsheet(oSettings).build().then(function () {
                    sap.m.MessageToast.show("Xuất Excel thành công!");
                });
            });
        }
    });
});