sap.ui.define(["sap/fe/core/PageController"], function (PageController) {
	"use strict";

	return PageController.extend("customCards.Main", {

		onInit: function () {
			PageController.prototype.onInit.apply(this);
		},

		onPressed: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext();
			this.routing.navigate(oContext);
		}
	});
});
