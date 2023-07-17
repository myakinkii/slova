sap.ui.define([
    "sap/fe/core/AppComponent",
    "sap/ui/model/odata/v4/ODataModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
], function (Component, ODataModel, Fragment, JSONModel, MessageToast ) {
    "use strict";

    return Component.extend("cc.slova.flashCards.Component", {

        metadata: {
            manifest: "json"
        },
        
        init: function () {
            var modelPromise = Promise.resolve()
            var compData = this.getComponentData()

            if (compData && compData.mobile) {
                modelPromise = this.getAuth().then(function(auth){
                    $.ajaxSetup({ headers: { Authorization: "Basic "+ btoa(auth.id+":"+auth.pwd) } });
                    var odataModel = this.createOdataModel()
                    this.setModel(odataModel)
                    return Promise.resolve()
                }.bind(this))
            }
            return modelPromise.then(function(){
                Component.prototype.init.apply(this, arguments);
            }.bind(this)).catch(function(err){
                console.log(err)
            })
        },

        getAuth:function(){
            var i18n = this.getModel("i18n")
            var authModel = new JSONModel({ "user":"", "pin":"" })

            var authPromise
            try {
                var creds = JSON.parse(window.localStorage.getItem("auth")||"{}")
                if (!creds.id) throw new Error()
                authPromise = Promise.resolve(creds)
            } catch (e) {
                authPromise = Fragment.load({
                    name: "cc.slova.flashCards.fragment.User",
                    controller: this
                }).then(function(dlg){
                    dlg.setModel(i18n,"i18n");
                    dlg.setModel(authModel, "auth")
                    return new Promise(function(resolve,reject){
                        dlg.getEndButton().attachPress(function(){ 
                            dlg.close();
                            var data = authModel.getData()
                            var creds = { id:data.id, user: data.user, pwd: data.pwd}
                            window.localStorage.setItem("auth",JSON.stringify(creds))
                            window.location.reload()
                            // resolve(creds)  // fiori elements dont wait for our promise
                            // so it fail without Component.init called on time (sync)
                        })
                        dlg.open()
                    })
                });
            }
            return authPromise
        },

        onboardUser:function(e){
            var authModel = e.getSource().getModel("auth")
            navigator.clipboard.readText().then(function(text){
                var creds
                try {
                    creds = JSON.parse(text)
                    if (!creds.id || !creds.pwd) throw new Error()
                    authModel.setProperty("/id",creds.id)
                    authModel.setProperty("/pwd",creds.pwd)
                    authModel.setProperty("/user",creds.user)
                    authModel.setProperty("/pin","OK")
                } catch(e) {
                    var user = authModel.getProperty("/user")
                    authModel.setProperty("/id",user)
                    authModel.setProperty("/pwd",user)
                    authModel.setProperty("/pin","NO_DATA")
                }
            })
        },

        createOdataModel:function(){
            var host = window.localStorage.getItem("backend") || 'http://localhost:4004'
            var svcUrl = this.getManifestEntry("sap.app").dataSources.mainService.uri
            var model =  new ODataModel({
                "serviceUrl": host + svcUrl,
                "synchronizationMode": "None",
                "operationMode": "Server",
                "autoExpandSelect": true,
                "earlyRequests": false
            })
            model.setSizeLimit(250) // need to think about it
            return model
        }

    });
});
