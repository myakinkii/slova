sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/Filter",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function (PageController, Filter, MessageToast, JSONModel) {
    "use strict";

    return PageController.extend("cc.slova.flashCards.Main", {

        onInit: function () {
            var deck = JSON.parse(window.localStorage.getItem("deck") || 'null')
            var filterModel = new JSONModel({
                import_ID: { key: "import_ID", vals: {} },
                createdBy: { key: "createdBy", vals: {} },
                pos: { key: "pos", vals: {} },
                lang: { key: "lang", vals: {} },
                deck: { key: "deck", vals: {} }
            })
            if (deck) filterModel.setData(deck)
            this.getView().setModel(filterModel, "deck")
            PageController.prototype.onInit.apply(this);
        },

        onBeforeRendering: function () {
            var filterModel = this.getView().getModel("deck")
            var deck = filterModel.getData()
            this.getView().byId("idFacetFilter").getLists().forEach(function (list) {
                var vals = deck[list.getKey()].vals
                list.setSelectedKeys(vals);
            });
            this.applyFilter()
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
            this.getView().byId("idCarousel").getBinding("pages").filter([], 'Control')
            window.localStorage.setItem("deck", 'null')
        },

        setFilter: function (e) {
            var filterModel = this.getView().getModel("deck")
            var key = e.getSource().getKey()
            var vals = e.getSource().getSelectedKeys()
            filterModel.setProperty("/" + key + "/vals", vals)
            if (key == 'deck') filterModel.setData({ 
                import_ID: { key: "import_ID", vals: {} },
                createdBy: { key: "createdBy", vals: {} },
                pos: { key: "pos", vals: {} },
                lang: { key: "lang", vals: {} },
                deck: { vals: vals }
            })
            window.localStorage.setItem("deck", JSON.stringify(filterModel.getData()))
            this.applyFilter()
        },

        applyFilter: function () {

            var facetFilter = this.getView().byId("idFacetFilter")
            var odata = facetFilter.getModel()

            var selectedFilters = facetFilter.getLists().filter(function (list) {
                return list.getSelectedItems().length;
            });

            function resolveDeckFilter(deck){
                return new Promise(function(resolve,reject){
                    var action = odata.bindContext("/resolveDeckFilter(...)")
                    action.setParameter("deck", deck)
                    action.execute().then(function () {
                        var ctx = action.getBoundContext().getObject()
                        return resolve(ctx.ids)
                    }).catch(function (err) {
                        MessageToast.show(err.message)
                        return resolve([])
                    })
                })
            }

            var filterPromise = new Promise(function(resolve,reject){
                var filter = []
                if (selectedFilters.length == 0){
                    return resolve(filter)
                } else if (selectedFilters.length==1 && selectedFilters[0].getKey()=='deck') {
                    var deck = selectedFilters[0].getSelectedItems()[0].getKey()
                    return resolveDeckFilter(deck).then(function(texts){
                        if (texts.length) filter = new Filter(texts.map(function (text) {
                            return new Filter("import_ID", "EQ", text);
                        }), false);
                        return resolve(filter)
                    })
                } else if (selectedFilters.length) {
                    filter = new Filter(selectedFilters.map(function (list) {
                        return new Filter(list.getSelectedItems().map(function (item) {
                            return new Filter(list.getKey(), "EQ", item.getKey());
                        }), false);
                    }), true);
                    return resolve(filter)
                }
            })

            var carousel = this.getView().byId("idCarousel")
            filterPromise.then(function(filter){
                carousel.getBinding("pages").filter(filter, 'Control')
            })  
        },

        forceRefresh: function (e) {
            
            var carousel = this.getView().byId("idCarousel")
            if (e.getParameter("item")) {
                var key = e.getParameter("item").getKey()
                var filter = []
                if( key != 'all' ) filter.push(new Filter("skip", "EQ", key == 'new' ? false : true))
                carousel.getBinding("pages").filter(filter, 'Application')
            } else carousel.getBinding("pages").refresh()

            this.getView().byId("idFacetFilter").getLists().forEach(function (list) {
                list.getBinding("items").refresh()
            })
        },

        addText: function (e) {
            var src = e.getSource()
            var odata = src.getModel()
            var action = odata.bindContext("/createText(...)");
            window.readFromClipboard().then(function (text) {
                if (!text) throw new Error('EMPTY_TEXT')
                action.setParameter("input", text)
                return action.execute()
            }).then(function () {
                var ctx = action.getBoundContext().getObject()
                MessageToast.show(ctx.ID)
            }.bind(this)).catch(function (err) {
                MessageToast.show(err.message)
            })
        },

        showUserDialog: function () {
            this.getAppComponent().showAuthDialog()
        }

    });
});
