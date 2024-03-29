sap.ui.define([
    "sap/fe/core/PageController",
    "sap/ui/model/Filter",
    "sap/m/MessageToast"
], function (PageController, Filter, MessageToast) {
    "use strict";

    return PageController.extend("cc.slova.textEditor.List", {

        onInit: function () {
            PageController.prototype.onInit.apply(this);
        },

        onAfterRendering: function (oEvent) {
            var oView = this.getView()
            oView.byId("FilterBar").setFilterValues("status", "NE", 9)
            oView.byId("FilterBar2").setFilterValues("status", "EQ", 9)
        },

        onPressed: function (oEvent) {
            var src = oEvent.getSource()
            this.routing.navigate(src.getBindingContext());
        },

        clearFilter:function(){
            this.getView().byId("idFacetFilter").getLists().forEach(function(list) {  list.setSelectedKeys() });
            this.getView().byId("idCarousel").getBinding("pages").filter([])
        },

        setFilter:function(){
            var selectedFilters = this.getView().byId("idFacetFilter").getLists().filter(function(list) {
                return list.getSelectedItems().length;
            });

            var filter = new Filter( selectedFilters.map(function(list) {
                return new Filter( list.getSelectedItems().map(function(item) {
                    return new Filter(list.getKey(), "EQ", item.getKey());
                }), false);
            }), true);

            this.getView().byId("idCarousel").getBinding("pages").filter(filter)
        },

        forceRefresh:function(){
            this.getView().byId("macroTable").getAggregation("content").getRowBinding().refresh()
            this.getView().byId("macroTable2").getAggregation("content").getRowBinding().refresh()
            this.getView().byId("macroTable3").getAggregation("content").getRowBinding().refresh()
            // this.getView().byId("macroTable").refresh() // does not exist until 1.117.0 (but ^ this works)
            // this.getView().byId("macroTable2").refresh() // but there odata.concat is broken in macors.Field
            this.getView().byId("idCarousel").getBinding("pages").refresh()
            this.getView().byId("idFacetFilter").getLists().forEach(function (list) {
                list.getBinding("items").refresh()
            })
        },

        addText:function(e){
            var src = e.getSource()
            var odata = src.getModel()
            var action = odata.bindContext("/createText(...)");
            action.setParameter("input",'').execute().then(function(){
                var ctx = action.getBoundContext().getObject()
                this.routing.navigateToRoute("customPage",{key:ctx.ID, "?query": { selectedTab:"input" } });
            }.bind(this)).catch(function(err){
                MessageToast.show(err.message)
            })
        },
    });
});
