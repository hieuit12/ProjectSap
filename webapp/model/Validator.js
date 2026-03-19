sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Reset value states in a SimpleForm
         * @param {sap.ui.layout.form.SimpleForm} oForm form to reset
         */
        resetForm: function (oForm) {
            if (!oForm) return;
            var aContent = null;
            if (typeof oForm.getContent === "function") {
                aContent = oForm.getContent();
            }
            if (!aContent) {
                aContent = oForm.getAggregation && oForm.getAggregation("content");
            }
            aContent = aContent || [];

            aContent.forEach(function (oControl) {
                if (oControl && typeof oControl.setValueState === "function") {
                    oControl.setValueState("None");
                }
            });
        },

        /**
         * Simple form validator
         * @param {sap.ui.layout.form.SimpleForm} oForm form to validate
         * @returns {boolean} valid status
         */
        validateForm: function (oForm) {
            if (!oForm) return true;
            var bValid = true;
            var aContent = null;
            if (typeof oForm.getContent === "function") {
                aContent = oForm.getContent();
            }
            if (!aContent) {
                aContent = oForm.getAggregation && oForm.getAggregation("content");
            }
            aContent = aContent || [];

            aContent.forEach(function (oControl) {
                if (oControl.getRequired && oControl.getRequired() && oControl.getValue) {
                    var sVal = oControl.getValue();
                    if (typeof sVal === "string") {
                        sVal = sVal.trim();
                    }
                    if (!sVal) {
                        oControl.setValueState("Error");
                        bValid = false;
                    } else {
                        oControl.setValueState("None");
                    }
                }
                if (oControl.getRequired && oControl.getRequired() && oControl.getSelectedKey) {
                    var sKey = oControl.getSelectedKey();
                    if (typeof sKey === "string") {
                        sKey = sKey.trim();
                    }
                    // Some controls (e.g. ComboBox) can show a typed/selected value
                    // while selectedKey is still empty. Accept non-empty value as valid.
                    var sDisplayVal = (oControl.getValue && oControl.getValue()) || "";
                    if (typeof sDisplayVal === "string") {
                        sDisplayVal = sDisplayVal.trim();
                    }
                    if (!sKey && !sDisplayVal) {
                        oControl.setValueState("Error");
                        bValid = false;
                    } else {
                        oControl.setValueState("None");
                    }
                }
            });
            return bValid;
        }
    };
});
