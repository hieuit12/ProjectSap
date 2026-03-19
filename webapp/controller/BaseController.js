sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast"
], function (Controller, History, MessageToast) {
	"use strict";

	return Controller.extend("com.sap341.smartwarehouse.controller.BaseController", {
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.core.mvc.Controller} the controller instance for chaining
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("Dashboard", {}, true);
			}
		},

		/**
		 * Helper method to show a message toast.
		 * @public
		 * @param {string} sMessage the message to show
		 */
		showMessage: function (sMessage) {
			MessageToast.show(sMessage);
		},

		/**
		 * Set busy indicator for the view
		 * @param {boolean} bIsBusy status
		 */
		setBusy: function (bIsBusy) {
			this.getView().setBusy(bIsBusy);
		},

		/**
		 * Get resource bundle text
		 * @param {string} sKey i18n key
		 * @param {array} aArgs arguments
		 * @returns {string} translated text
		 */
		getText: function (sKey, aArgs) {
			return this.getResourceBundle().getText(sKey, aArgs);
		},

		/**
		 * Extract human-friendly error message from OData/Gateway response
		 * @param {object} oError OData error object
		 * @returns {string} extracted message
		 */
		getODataErrorMessage: function (oError) {
			try {
				var sResponseText = oError && (oError.responseText || (oError.response && oError.response.body));
				if (sResponseText) {
					var oBody = JSON.parse(sResponseText);
					var sMsg = oBody && oBody.error && oBody.error.message && oBody.error.message.value;
					if (sMsg) {
						return sMsg;
					}
				}
			} catch (e) {
				// ignore parse errors
			}

			try {
				var sSapMessage = oError && oError.response && oError.response.headers && oError.response.headers["sap-message"];
				if (sSapMessage) {
					var oSap = JSON.parse(sSapMessage);
					if (oSap && oSap.message) {
						return oSap.message;
					}
				}
			} catch (e2) {
				// ignore parse errors
			}

			return (oError && oError.message) || "Request failed.";
		}
	});
});
