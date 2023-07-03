sap.ui.define([
    "sap/fe/core/PageController", 
    "sap/ui/core/Fragment", 
    "./globalFormatter"
], function (PageController, Fragment) {
    "use strict";

    return PageController.extend("cc.slova.textEditor.Main", {

        onInit: function () {
            PageController.prototype.onInit.apply(this);
            this.popoverPromise = Fragment.load({name: "cc.slova.textEditor.WordPopover"})
        },

        showWordPopover:function(e){
            var link = e.getSource()
            this.popoverPromise.then(function(popover){
                popover.setModel(link.getModel())
                popover.bindElement(link.getBindingContext().getPath())
                popover.openBy(link)
            })
        }
    });
});
