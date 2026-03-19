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
		getStocks: function (oModel, aFilters) {
			return new Promise(function (resolve, reject) {
				oModel.read("/StockSet", {
					filters: aFilters || [],
					success: function (oData) {
						resolve(oData.results);
					},
					error: function (oError) {
						reject(oError);
					}
				});
			});
		},

		updateStock: function (oModel, oPayload) {
			var sPath = oModel.createKey("/StockSet", {
				MaterialId: oPayload.MaterialId,
				Plant: oPayload.Plant,
				StorageLocation: oPayload.StorageLocation
			});

			var oRequestPayload = Object.assign({}, oPayload, {
				Quantity: formatQuantity(oPayload.Quantity)
			});

			return new Promise(function (resolve, reject) {
				// Ensure CSRF token is available for PUT
				oModel.refreshSecurityToken(function () {
					oModel.update(sPath, oRequestPayload, {
						// Send immediately even when model uses deferred batch groups
						groupId: "$direct",
						// Use MERGE semantics + bypass ETag handling
						merge: true,
						eTag: "*",
						success: function () {
							resolve();
						},
						error: function (oError) {
							reject(oError);
						}
					});
				}, function (oError) {
					reject(oError);
				}, true);
			});
		},
		
		createStock: function (oModel, oPayload) {
			var oRequestPayload = Object.assign({}, oPayload, {
				Quantity: formatQuantity(oPayload.Quantity)
			});
			return new Promise(function (resolve, reject) {
				// Ensure CSRF token is available for POST
				oModel.refreshSecurityToken(function () {
					oModel.create("/StockSet", oRequestPayload, {
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
