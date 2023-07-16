sap.ui.define([], function () {
    "use strict";

    var POS = {
        'NOUN':true,
        'PRON':true,
        'DET':true,
        'VERB':true,
        'AUX':true,
        'ADJ':true,
        'ADV':true,
    }

    return {

        linkFormat: function (form, pos, userPos) {
            if (!(form && pos)) return ''
            if ( userPos=="" && POS[pos] ) {
                this.addStyleClass("linkPOS_"+pos)
            } else if (userPos.split(",").indexOf(pos)>-1) {
                this.addStyleClass("linkPOS_"+pos)
            } else {
                this.addStyleClass("linkPOS_disabled")
                // this.setEnabled(false)
            }
            return form;
        },

        featsFormat:function(feats){
            if (!feats) return '';
            return feats.split("|").join(", ")
        }

    };
},true);