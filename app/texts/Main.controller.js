sap.ui.define([
    "sap/fe/core/PageController", 
    "sap/ui/core/Fragment", 
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "./globalFormatter"
], function (PageController, Fragment, JSONModel, MessageToast, BusyIndicator) {
    "use strict";

    return PageController.extend("cc.slova.textEditor.Main", {

        onInit: function () {
            PageController.prototype.onInit.apply(this);
            var uiModel = new JSONModel({ showSidePanel:true, selectedTab:"input" })
            this.popoverPromise = Fragment.load({ name: "cc.slova.textEditor.WordPopover", controller: this })
            this.popoverPromise.then(function(popover){
                popover.setModel(uiModel,"ui")
            })
            this.getView().setModel(uiModel,"ui")
            // document.addEventListener("selectionchange",this.onSelectText.bind(this))
        },

        onSelectText:function(e){
            var text = this.getView().byId("inputText").getSelectedText()
            console.log(text)
        },

        parseText:function(e){
            var src = e.getSource()
            var odata = src.getModel()
            var action = odata.bindContext("TextsService.parseText(...)", src.getBindingContext() );
            BusyIndicator.show(100)
            action.execute().then(function(){
                BusyIndicator.hide();
                src.getBindingContext().refresh()
            }).catch(function(err){
                // console.log(err)
                BusyIndicator.hide();
                MessageToast.show(err.message)
            })
        },

        getDefinition:function(e){
            var src = e.getSource() // input field
            var lemma = src.getValue()
            var lang = src.getBindingContext().getProperty("lang_code")
            var odata = src.getModel()
            var action = odata.bindContext("/getDefinition(...)");
            action.setParameter("lang", lang).setParameter("lemma", lemma)
            action.execute().then(function(){
                var url = action.getBoundContext().getObject()
                if (url.value) sap.m.URLHelper.redirect(url.value, true)
            })
        },

        syncChanges:function(e){
            var src = e.getSource()
            var odata = src.getModel()
            var ctx = src.getBindingContext("ui").getObject()
            var action = odata.bindContext("/syncToken(...)");
            action.setParameter("token", {
                importId : ctx.up__import_ID,
                hash     : ctx.up__hash,
                index    : ctx.index,
                lemma    : ctx.lemma,
                pos      : ctx.pos,
                feats    : Object.entries(ctx.features).reduce(function(prev,cur){
                    if( cur[1] ) prev.push(cur[0]+"="+cur[1])
                    return prev
                },[]).join("|")
            })
            BusyIndicator.show(100);
            action.execute().then(function(){
                BusyIndicator.hide();
                src.getBindingContext().refresh()
            }).catch(function(err){
                // console.log(err)
                BusyIndicator.hide();
                MessageToast.show(err.message)
            })
        },

        showWordPopover:function(e){
            var link = e.getSource()
            this.popoverPromise.then(function(popover){
                var uiModel = popover.getModel("ui")
                popover.setModel(link.getModel())
                popover.bindElement({
                    path: link.getBindingContext().getPath(), 
                    events:{ 
                        dataReceived:function(){
                            var data = popover.getElementBinding().getBoundContext().getObject()
                            data.features = data.feats.split("|").reduce(function(prev,cur){
                                var f=cur.split("=")
                                prev[f[0]]=f[1]
                                return prev;
                            },{})
                            uiModel.setProperty("/token",data)
                        }
                    }
                })
                if (uiModel.getProperty("/showSidePanel")==false) popover.openBy(link)
            })
        }
    });
});
