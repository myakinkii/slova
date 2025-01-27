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
            this.wordPopoverPromise = Fragment.load({ name: "cc.slova.textEditor.WordPopover", controller: this })
            this.wordPopoverPromise.then(function(popover){
                popover.setModel(uiModel,"ui")
            })

            this.sentenceDialogPromise = Fragment.load({ name: "cc.slova.textEditor.SentenceDialog", controller: this })
            this.sentenceDialogPromise.then(function(dlg){
                dlg.setModel(uiModel,"ui")
                dlg.getEndButton().attachPress(function(){ 
                    sap.ui.getCore().byId("definitionText").setText('')
                    dlg.close()
                })
                return dlg
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

        onPrintWords:function(e){
            var selectedFilters = this.byId("FilterBarWord").getFilters()
            // console.log(selectedFilters.search) // also have search
            var realFiltersArray = selectedFilters.filters[0] && selectedFilters.filters[0].aFilters || selectedFilters.filters
            var filterData = realFiltersArray.reduce( (prev,cur) => { // for now we support only basic AND case here
                prev[cur.getPath()] = cur.getValue1()
                return prev
            },{})

            var odata = this.getView().getModel()
            var ID = e.getSource().getBindingContext().getProperty("ID")
            
            var action = odata.bindContext("/printWords(...)")

            action.setParameter("ID", ID)
            if (filterData.morphem) action.setParameter("morphem", filterData.morphem)
            if (filterData.pos) action.setParameter("pos", filterData.pos)
            if (filterData.tier) action.setParameter("tier", filterData.tier)

            BusyIndicator.show(100)
            action.execute().then(function(){
                BusyIndicator.hide()
                var result = action.getBoundContext().getObject()
                var byteArray = Uint8Array.from(atob(result.value), c => c.charCodeAt(0))
                var pdf = new Blob([byteArray], { type: "application/pdf" })
                sap.m.URLHelper.redirect(window.URL.createObjectURL(pdf), true)
            }).catch(function(err){
                BusyIndicator.hide()
                // console.log(err)
            })
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

        getGoogleSpeechResult:function(ctx, text){

            var action = ctx.getModel().bindContext("TextsService.textToSpeech(...)", ctx )
            action.setParameter("text", text)

            BusyIndicator.show(100)
            return new Promise(function(resolve, reject){
                action.execute().then(function(){
                    BusyIndicator.hide()
                    var result = action.getBoundContext().getObject()
                    var byteArray = Uint8Array.from(atob(result.value), c => c.charCodeAt(0))
                    var speech = new Blob([byteArray], { type: "audio/ogg; codecs=opus" })
                    resolve(window.URL.createObjectURL(speech))
                }).catch(function(err){
                    BusyIndicator.hide()
                    MessageToast.show(err.message)
                    reject(err)
                })
            })
        },

        textToSpeech:function(e){
            var mdl = this.getView().getModel("ui")
            if (mdl.getProperty("/mediaLink2")) return

            var odataCtx = e.getSource().getBindingContext()
            var text = mdl.getProperty("/speechToTextResult")
            this.getGoogleSpeechResult(odataCtx, text).then(function(speech){ 
                mdl.setProperty("/mediaLink2", speech)
            }).catch(function(err){
                // console.log(err)
            })
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

        showSentencePopover:function(e){
            var link = e.getSource()
            this.sentenceDialogPromise.then(function(dlg){
                dlg.setModel(link.getModel())
                dlg.bindElement({ path: link.getBindingContext().getPath() })
                dlg.open()
            })
        },

        translateSentence:function(e){
            // this comes from our after handler for which we need lang_code in odata $select
            var url = e.getSource().getBindingContext().getProperty("translation")
            if (url) sap.m.URLHelper.redirect(url, true)
        },

        callActionPromised:function(action){
            BusyIndicator.show(100)
            return new Promise(function(resolve, reject){
                action.execute().then(function(){
                    BusyIndicator.hide()
                    resolve(action.getBoundContext().getObject())
                }).catch(function(err){
                    BusyIndicator.hide()
                    MessageToast.show(err.message)
                    reject(err)
                })
            })
        },

        generateDefinition:function(e){
            var odataCtx = this.getView().getBindingContext()
            var pars = e.getSource().getBindingContext().getObject()

            var action = odataCtx.getModel().bindContext("TextsService.generateDefinition(...)", odataCtx )
            action.setParameter("ID", pars.import_ID).setParameter("hash", pars.hash)

            this.callActionPromised(action).then(function(definition){
                sap.ui.getCore().byId("definitionText").setText(definition.value)
            }).catch(function(err){
                // console.log(err)
            })
        },

        speakSentence:function(e){
            var odataCtx = this.getView().getBindingContext()
            var text = e.getSource().getBindingContext().getProperty("text")
            this.getGoogleSpeechResult(odataCtx, text).then(function(speech){ 
                sap.m.URLHelper.redirect(speech, true)
                // window.open(speech, '_blank')
            }).catch(function(err){
                // console.log(err)
            })
        },

        showWordPopover:function(e){
            var link = e.getSource()
            this.wordPopoverPromise.then(function(popover){
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
