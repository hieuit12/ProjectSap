sap.ui.define([], function () {
	"use strict";

	function formatQuantity(vQuantity) {
		var f = typeof vQuantity === "number" ? vQuantity : parseFloat(vQuantity);
		if (isNaN(f)) {
			return "0.000";
		}
		return f.toFixed(3);
	}

	return {
		postGoodsReceipt: function (oModel, oPayload) {
			var oRequestPayload = Object.assign({}, oPayload, {
				Quantity: formatQuantity(oPayload.Quantity)
			});
			return new Promise(function (resolve, reject) {
				// Ensure CSRF token is available for POST
				oModel.refreshSecurityToken(function () {
					oModel.create("/GoodsReceiptSet", oRequestPayload, {
						// Send immediately even when model uses deferred batch groups
						groupId: "$direct",
						success: function (oData) {
							resolve(oData);
						},
						error: function (oError) {
							reject(oError);
						}
					});
				}, function (oError) {
					reject(oError);
				}, true);
			});
		}
	};
});
