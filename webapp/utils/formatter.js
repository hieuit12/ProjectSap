sap.ui.define([], function () {
	"use strict";

	return {
		formatStatusState: function (sStatus) {
			switch (sStatus) {
				case "SUCCESS":
					return "Success";
				case "ERROR":
					return "Error";
				case "PENDING":
					return "Warning";
				default:
					return "None";
			}
		},

		formatDate: function (oDate) {
			if (!oDate) {
				return "";
			}
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd/MM/yyyy"
			});
			return oDateFormat.format(oDate);
		}
	};
});
