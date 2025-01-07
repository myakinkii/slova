sap.ui.define([
    "sap/fe/core/PageController", 
    "sap/ui/core/Fragment", 
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "./globalFormatter"
], function (PageController, Fragment, JSONModel, MessageToast, BusyIndicator) {
    "use strict";

    var mediaRecorder, chunks, blob

    return PageController.extend("cc.slova.textEditor.Main", {

        onInit: function () {
            PageController.prototype.onInit.apply(this);
            var uiModel = new JSONModel()
            this.popoverPromise = Fragment.load({ name: "cc.slova.textEditor.WordPopover", controller: this })
            this.popoverPromise.then(function(popover){
                popover.setModel(uiModel,"ui")
            })
            this.getView().setModel(uiModel,"ui")

			this.getAppComponent().getRouter().getRoute("customPage").attachPatternMatched(function(e){
                var query = e.getParameter("arguments")["?query"] || {}
                var tab = query.selectedTab || "output"
                uiModel.setData({ 
                    showSidePanel:tab=="input", selectedTab:tab, 
                    mediaLink:null, mediaLink2:null,
                    speechToTextResult:''
                })
            });

            // document.addEventListener("selectionchange",this.onSelectText.bind(this))
        },

        onSelectText:function(e){
            var text = this.getView().byId("inputText").getSelectedText()
            console.log(text)
        },

        captureAudio:function(e){
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.log("getUserMedia not supported!")
                return
            }
            var mdl = this.getView().getModel("ui")
            var record = e.getSource().getPressed()
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                if (record) {
                    mediaRecorder = new MediaRecorder(stream)
                    chunks = []
                    mediaRecorder.start(300) // sample at least every 300ms
                    mediaRecorder.ondataavailable = (e) => { chunks.push(e.data) }
                    mdl.setProperty("/mediaLink",null)
                } else {
                    mediaRecorder.stop()
                    blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" })
                    chunks = []
                    mdl.setProperty("/mediaLink",window.URL.createObjectURL(blob))
                }
            }).catch((err) => {
                console.log(err)
            })
        },

        getBase64Voice:function(){
            var fileReader = new FileReader()
            fileReader.readAsDataURL(blob)
            return new Promise(function(resolve, reject){
                fileReader.onloadend = function(){
                    resolve(fileReader.result.replace('data:audio/ogg; codecs=opus;base64,',''))
                }
            })
        },

        textToSpeech:function(e){

            var src = e.getSource()
            var mdl = this.getView().getModel("ui")
            var odata = src.getModel()

            if (mdl.getProperty("/mediaLink2")) return

            var action = odata.bindContext("TextsService.textToSpeech(...)", src.getBindingContext() )
            action.setParameter("text", mdl.getProperty("/speechToTextResult"))

            BusyIndicator.show(100)
            action.execute().then(function(){
                var result = action.getBoundContext().getObject()
                var byteArray = Uint8Array.from(atob(result.value), c => c.charCodeAt(0))
                var speech = new Blob([byteArray], { type: "audio/ogg; codecs=opus" })
                mdl.setProperty("/mediaLink2", window.URL.createObjectURL(speech))
                BusyIndicator.hide();
            }).catch(function(err){
                // console.log(err)
                BusyIndicator.hide();
                MessageToast.show(err.message)
            })

            // to use our own voice
            // this.getBase64Voice().then(function(base64Voice){
            //     var byteArray = Uint8Array.from(atob(base64Voice), c => c.charCodeAt(0))
            //     var speech = new Blob([byteArray], { type: "audio/ogg; codecs=opus" })
            //     mdl.setProperty("/mediaLink2", window.URL.createObjectURL(speech))
            // })
        },

        speechToText:function(e){

            var src = e.getSource()
            var mdl = this.getView().getModel("ui")
            var odata = src.getModel()
            var action = odata.bindContext("TextsService.speechToText(...)", src.getBindingContext() );
            this.getBase64Voice().then(function(base64Voice){
                action.setParameter("content", base64Voice)
                BusyIndicator.show(100)
                return action.execute()
            }).then(function(){
                var result = action.getBoundContext().getObject()
                mdl.setProperty("/speechToTextResult", result.value)
                mdl.setProperty("/mediaLink2", null)
                BusyIndicator.hide();
            }).catch(function(err){
                // console.log(err)
                BusyIndicator.hide();
                MessageToast.show(err.message)
            })
        },

        addSpeechToInput:function(e){

            var src = e.getSource()
            var mdl = this.getView().getModel("ui")
            var odata = src.getModel()
            var action = odata.bindContext("TextsService.addSpeechToInput(...)", src.getBindingContext() )
            action.setParameter("content", mdl.getProperty("/speechToTextResult"))

            action.execute().then(function(){
                mdl.setProperty("/speechToTextResult", '')
                src.getBindingContext().refresh()
            }).catch(function(err){
                // console.log(err)
                MessageToast.show(err.message)
            })
        },

        googleTranslate:function(e){

            var src = e.getSource()
            var mdl = this.getView().getModel("ui")
            var odata = src.getModel()

            var action = odata.bindContext("TextsService.getGoogleTranslateLink(...)", src.getBindingContext() )
            action.setParameter("text", mdl.getProperty("/speechToTextResult"))
            action.setParameter("lang", src.getBindingContext().getProperty("lang_code"))

            action.execute().then(function(){
                var url = action.getBoundContext().getObject()
                if (url.value) sap.m.URLHelper.redirect(url.value, true)
            }).catch(function(err){
                MessageToast.show(err.message)
            })
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

        generateText:function(e){
            var src = e.getSource()
            var odata = src.getModel()
            var action = odata.bindContext("TextsService.generateText(...)", src.getBindingContext() );
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
                            data.features = (data.feats||"").split("|").reduce(function(prev,cur){
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
        },

        splitPosTokens:function(pos){
            return !!pos ? pos.split(",") : []
        },

        changePos:function(e){
            var src = e.getSource()
            src.getBindingContext().setProperty("pos", src.getSelectedKeys().join(","))
        }
    });
});
