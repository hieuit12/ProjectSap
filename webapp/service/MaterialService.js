sap.ui.define([], function () {
	"use strict";

	return {
		getMaterials: function (oModel) {
			return new Promise(function (resolve, reject) {
				oModel.read("/MaterialSet", {
					success: function (oData) {
						resolve(oData.results);
					},
					error: function (oError) {
						reject(oError);
					}
				});
			});
		},

		createMaterial: function (oModel, oPayload) {
			return new Promise(function (resolve, reject) {
				// Ensure CSRF token is available for POST
				oModel.refreshSecurityToken(function () {
					oModel.create("/MaterialSet", oPayload, {
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
