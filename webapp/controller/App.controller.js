sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("com.sap341.smartwarehouse.controller.App", {
		onInit: function () {
		},

		onSideNavButtonPress: function () {
			var oToolPage = this.byId("toolPage");
			var bSideExpanded = oToolPage.getSideExpanded();

			oToolPage.setSideExpanded(!bSideExpanded);
		},

		onItemSelect: function (oEvent) {
			var sKey = oEvent.getParameter("item").getKey();
			var oRouter = UIComponent.getRouterFor(this);

			switch (sKey) {
				case "dashboard":
					oRouter.navTo("Dashboard");
					break;
				case "materials":
					oRouter.navTo("MaterialList");
					break;
				case "stock":
					oRouter.navTo("StockList");
					break;
				case "history":
					oRouter.navTo("History");
					break;
				default:
					break;
			}
		}
	});
});