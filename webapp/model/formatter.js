sap.ui.define([
    "sap/ui/core/format/NumberFormat",
    "sap/ui/core/ValueState",
    "sap/ui/core/format/DateFormat"
], function (NumberFormat, ValueState, DateFormat) {
    "use strict";

    return {
        quantity: function (fValue) {
            if (!fValue) return "0.000";
            var oFloatFormat = NumberFormat.getFloatInstance({ minFractionDigits: 3, maxFractionDigits: 3 });
            return oFloatFormat.format(fValue);
        },

        formattedHistoryQuantity: function (fValue, sMovementType) {
            if (!fValue) return "0.000";
            var fParsed = parseFloat(fValue);
            var oFloatFormat = NumberFormat.getFloatInstance({ minFractionDigits: 3, maxFractionDigits: 3 });
            var sFormattedValue = oFloatFormat.format(Math.abs(fParsed));

            // Nhập kho (Tăng tồn)
            var aPositiveTypes = ["101", "501", "561"];
            // Xuất kho / Điều chỉnh giảm (Giảm tồn)
            var aNegativeTypes = ["102", "201", "502", "562"];

            // Fallback: nếu BE trả Quantity âm/dương nhưng MovementType trống -> vẫn giữ dấu
            if (!sMovementType) {
                if (fParsed < 0) { return "- " + sFormattedValue; }
                if (fParsed > 0) { return "+ " + sFormattedValue; }
                return sFormattedValue;
            }

            if (aPositiveTypes.includes(sMovementType)) {
                return "+ " + sFormattedValue;
            } else if (aNegativeTypes.includes(sMovementType)) {
                return "- " + sFormattedValue;
            }
            return sFormattedValue;
        },

        stockStatusState: function (fQuantity) {
            if (fQuantity <= 0) return ValueState.Error;
            if (fQuantity <= 10) return ValueState.Warning;
            return ValueState.Success;
        },

        movementText: function (sType) {
            if (!sType) return "Unknown";
            var oMap = {
                "101": "GR PO",
                "102": "GR PO Rev",
                "201": "GI Cost Center",
                "501": "GR w/o PO",
                "502": "GR w/o PO Rev",
                "561": "Init. Stock",
                "562": "Init. Stock Rev"
            };
            return oMap[sType] || sType;
        },

        movementState: function (sType, fQuantity) {
            var aPositiveTypes = ["101", "501", "561"];
            var aNegativeTypes = ["102", "201", "502", "562"];
            if (aPositiveTypes.includes(sType)) return ValueState.Success;
            if (aNegativeTypes.includes(sType)) return ValueState.Error;
            var fParsed = typeof fQuantity === "number" ? fQuantity : parseFloat(fQuantity);
            if (!isNaN(fParsed)) {
                if (fParsed < 0) return ValueState.Error;
                if (fParsed > 0) return ValueState.Success;
            }
            return ValueState.None;
        },

        date: function (vDate) {
            if (!vDate) {
                return "";
            }
            var oDate = vDate instanceof Date ? vDate : new Date(vDate);
            if (isNaN(oDate.getTime())) {
                return "";
            }
            return DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" }).format(oDate);
        }
    };
});