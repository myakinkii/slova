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
            var filterModel = new JSONModel( deck || this.getEmptyModel())
            this.getView().setModel(filterModel, "deck")
            PageController.prototype.onInit.apply(this);
        },

        onBeforeRendering: function () {
            var filterData = this.getView().getModel("deck").getData()
            this.syncFacetFilter(filterData)
            this.applyFilter(filterData)
        },

        getEmptyModel: function(){
            return {
                import_ID: { key: "import_ID", vals: {} },
                createdBy: { key: "createdBy", vals: {} },
                pos: { key: "pos", vals: {} },
                lang: { key: "lang", vals: {} },
                deck: { key: "deck", vals: {} }
            }
        },

        syncFacetFilter : function(filterData){
            this.getView().byId("idFacetFilter").getLists().forEach(function (list) {
                var vals = filterData[list.getKey()].vals
                list.setSelectedKeys(vals);
            });
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
            // this.getView().byId("idFacetFilter").getLists().forEach(function (list) { list.setSelectedKeys() });
            this.getView().byId("idCarousel").getBinding("pages").filter([], 'Control')
            this.syncFacetFilter(this.getEmptyModel())
            window.localStorage.setItem("deck", 'null')
        },

        setFilter: function (e) {
            var filterModel = this.getView().getModel("deck")
            var key = e.getSource().getKey()
            var vals = e.getSource().getSelectedKeys()
            
            filterModel.setProperty("/" + key + "/vals", vals)
            if (key == 'deck') filterModel.setProperty("/import_ID/vals", {})
            if (key == 'import_ID') filterModel.setProperty("/deck/vals", {})
            
            var filterData = filterModel.getData()
            window.localStorage.setItem("deck", JSON.stringify(filterData))
            this.syncFacetFilter(filterData)
            this.applyFilter(filterData)
        },

        calculateFilters: function(filterData, odataModel){

            function resolveDeckFilter(deck){
                return new Promise(function(resolve,reject){
                    var action = odataModel.bindContext("/resolveDeckFilter(...)")
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

            return new Promise(function(resolve,reject){

                var selectedFilters = Object.values(filterData).reduce(function(prev, cur){
                    if (cur.key=='deck') return prev // skip deck
                    var keys = Object.keys(cur.vals)
                    if (keys.length > 0) prev[cur.key]=keys
                    return prev
                },{})

                var resolved = Promise.resolve(selectedFilters)

                var deck = Object.keys(filterData['deck'].vals)[0]
                if (deck) {
                    resolved = resolveDeckFilter(deck, odataModel).then(function(texts){
                        selectedFilters["import_ID"]=texts
                        return Promise.resolve(selectedFilters)
                    })
                }

                return resolved.then(function(selectedFilters){
                    var filter = []
                    var entries = Object.entries(selectedFilters)
                    if (entries.length==0) return resolve(filter)
                    filter = new Filter(entries.map(function (item) {
                        return new Filter(item[1].map(function (val) {
                            return new Filter(item[0], "EQ", val);
                        }), false);
                    }), true);
                    return resolve(filter)
                })
            }) 
        },

        applyFilter: function (filterData) {
            var carousel = this.getView().byId("idCarousel")
            this.calculateFilters(filterData, carousel.getModel()).then(function(filter){
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
