sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/Filter",
    "sap/m/MessageToast"
], function (PageController, Filter, MessageToast) {
    "use strict";

    return PageController.extend("cc.slova.flashCards.Main", {

        onInit: function () {
            PageController.prototype.onInit.apply(this);
        },

        getRandomForm: function (form1) {
            if (!form1) return ''
            var forms = Object.values(arguments).filter(v => !!v)
            var random = forms[Math.floor(Math.random() * forms.length)]
            return random
        },

        delayMorhpem: function (morphem) {
            if (!morphem) return ''
            return new Promise(function (resolve) {
                window.setTimeout(() => resolve(morphem), 1500)
            })
        },

        onPressed: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            this.routing.navigate(oContext);
        },

        clearFilter: function () {
            this.getView().byId("idFacetFilter").getLists().forEach(function (list) { list.setSelectedKeys() });
            this.getView().byId("idCarousel").getBinding("pages").filter([])
        },

        setFilter: function () {
            var selectedFilters = this.getView().byId("idFacetFilter").getLists().filter(function (list) {
                return list.getSelectedItems().length;
            });

            var filter = new Filter(selectedFilters.map(function (list) {
                return new Filter(list.getSelectedItems().map(function (item) {
                    return new Filter(list.getKey(), "EQ", item.getKey());
                }), false);
            }), true);

            this.getView().byId("idCarousel").getBinding("pages").filter(filter)
        },

        forceRefresh: function () {
            this.getView().byId("idCarousel").getBinding("pages").refresh()
        },

        addText: function (e) {
            var src = e.getSource()
            var odata = src.getModel()
            var action = odata.bindContext("/createText(...)");
            navigator.clipboard.readText().then(function (text) {
                action.setParameter("input", text || '')
                return action.execute()
            }).then(function () {
                var ctx = action.getBoundContext().getObject()
                MessageToast.show(ctx.ID)
            }.bind(this)).catch(function (err) {
                MessageToast.show(err.message)
            })
        },

        showUserDialog:function(){
            this.getAppComponent().showAuthDialog()
        }

    });
});
