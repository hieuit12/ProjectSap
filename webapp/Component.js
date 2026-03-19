/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/sap341/smartwarehouse/model/models",
    "sap/m/MessageBox"
],
    function (UIComponent, Device, models, MessageBox) {
        "use strict";

        return UIComponent.extend("com.sap341.smartwarehouse.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // Ensure create/update requests are sent immediately (avoid $batch hanging in preview)
                var oMainModel = this.getModel();
                if (oMainModel && oMainModel.setUseBatch) {
                    oMainModel.setUseBatch(false);
                }
                // Global OData error handler (avoid silent "stuck" UI)
                if (oMainModel && oMainModel.attachRequestFailed) {
                    oMainModel.attachRequestFailed(function (oEvent) {
                        try {
                            var oParams = oEvent.getParameters() || {};
                            var oResponse = oParams.response || {};
                            var sMsg = "";
                            if (oResponse.responseText) {
                                try {
                                    var oErr = JSON.parse(oResponse.responseText);
                                    sMsg = oErr && oErr.error && oErr.error.message && oErr.error.message.value;
                                } catch (e) { /* ignore */ }
                            }
                            if (!sMsg) {
                                sMsg = (oResponse.statusCode ? (oResponse.statusCode + " " + (oResponse.statusText || "")) : "") || "Request failed.";
                            }
                            MessageBox.error(sMsg);
                        } catch (e2) {
                            MessageBox.error("Request failed.");
                        }
                    });
                }
                if (oMainModel && oMainModel.attachRequestSent) {
                    oMainModel.attachRequestSent(function (oEvent) {
                        try {
                            var oP = oEvent.getParameters() || {};
                            // eslint-disable-next-line no-console
                            console.log("[OData] Request sent:", oP.method, oP.url);
                        } catch (e) { /* ignore */ }
                    });
                }
                if (oMainModel && oMainModel.attachRequestCompleted) {
                    oMainModel.attachRequestCompleted(function (oEvent) {
                        try {
                            var oP = oEvent.getParameters() || {};
                            // eslint-disable-next-line no-console
                            console.log("[OData] Request completed:", oP.success, oP.url);
                        } catch (e) { /* ignore */ }
                    });
                }

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            }
        });
    }
);