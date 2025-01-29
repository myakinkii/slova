sap.ui.define(["sap/fe/core/PageController"], function (PageController) {
    "use strict";

    return PageController.extend("cc.slova.workbook.Main", {

        onInit: function () {
            PageController.prototype.onInit.apply(this);
        },

        calcRatio: function(learned, total){
            return 100*learned/total || 0
        },

        calcColor:function(learned, total){
            var ratio = learned/total
            if (ratio > 0.9) return 'Good'
            if (ratio > 0.5) return 'Critical'
            if (ratio == 0)return 'None'
            return 'Error'
        }
        
    })
})