sap.ui.define([
    "sap/fe/core/AppComponent",
    "sap/ui/model/odata/v4/ODataModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
], function (Component, ODataModel, Fragment, JSONModel, MessageToast ) {
    "use strict";

    if(!window.startScan) {
        // desktop implementation of qr code scan
        window.startScan = async () => {
            return navigator.clipboard.readText().then(function(text){
                try {
                    const creds = JSON.parse(text)
                    if (!creds.id || !creds.pwd) throw new Error()
                    return creds
                } catch(e) {
                    throw new Error('INVALID_CODE')
                }
            })
        }
    }

    return Component.extend("cc.slova.flashCards.Component", {

        metadata: {
            manifest: "json"
        },
        
        init: function () {

            var i18n = this.getModel("i18n")
            var creds = JSON.parse(window.localStorage.getItem("auth")||"{}")
            var authModel = new JSONModel(creds)

            this.authDlgPromise = Fragment.load({
                name: "cc.slova.flashCards.fragment.User",
                controller: this
            }).then(function(dlg){
                dlg.setModel(i18n,"i18n");
                dlg.setModel(authModel, "auth")
                dlg.getEndButton().attachPress(function(){ 
                    dlg.close();
                    var data = authModel.getData()
                    var creds = { id:data.id, user: data.user, pwd: data.pwd}
                    window.localStorage.setItem("auth",JSON.stringify(creds))
                    window.location.reload()
                    // resolve(creds)  // fiori elements dont wait for our promise
                    // so it fail without Component.init called on time (sync)
                })
                return dlg;
            })

            var modelPromise = Promise.resolve()
            var compData = this.getComponentData()

            if (compData && compData.mobile) {
                var mainSvcUrl = this.getManifestEntry("sap.app").dataSources.mainService.uri
                modelPromise = this.getAuth().then(function(auth){
                    $.ajaxSetup({ headers: { Authorization: "Basic "+ btoa(auth.id+":"+auth.pwd) } });
                    var odataModel = this.createOdataModel(mainSvcUrl)
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

        showAuthDialog:function(){
            this.authDlgPromise.then(function(dlg){
                dlg.open()
            })
        },

        scanQr:function(e){
            var authModel = e.getSource().getModel("auth")
            if (window.startScan) {
                window.startScan().then(function(auth){
                    auth.pin = "OK"
                    authModel.setData(auth)
                }).catch(function(err){
                    console.log(err)
                    MessageToast.show(err.message)
                })  
            }
        },

        clearAuthData:function(){
            window.localStorage.removeItem("auth")
            window.location.reload()
        },

        getAuth:function(){
            var authPromise
            try {
                var creds = JSON.parse(window.localStorage.getItem("auth")||"{}")
                if (!creds.id) throw new Error()
                authPromise = Promise.resolve(creds)
            } catch (e) {
                authPromise = this.authDlgPromise.then(function(dlg){
                    return new Promise(function(resolve,reject){
                        dlg.open()
                    })
                });
            }
            return authPromise
        },

        onboardUser:function(e){
            var authModel = e.getSource().getModel("auth")
            var creds = authModel.getData()

            if ( !creds.id || !creds.pwd ) {
                MessageToast.show('NO_CREDS')
                return
            } else if ( !creds.user ){
                MessageToast.show('NO_NAME')
                return
            }

            var odata = this.createOdataModel("/onboard/")
            var ctx = odata.bindContext("/claimUser(...)");
            ctx.setParameter("id", creds.id).setParameter("pwd", creds.pwd).setParameter("name", creds.user)
            ctx.execute().then(function(){
                return Promise.resolve(ctx.getBoundContext().getObject())
            }).then(function(result){
                if(!result.value) throw new Error("ALREADY_ONBOARDED")
                authModel.setProperty("/pwd",result.value)
            }).catch(function(err){
                MessageToast.show(err.message)
                console.log(err)
            })
        },

        generatePin:function(e){
            var authModel = e.getSource().getModel("auth")
            var creds = authModel.getData()

            if ( !creds.id || !creds.pwd ) {
                MessageToast.show('NO_CREDS')
                return
            }
            
            var odata = this.createOdataModel("/onboard/")
            var ctx = odata.bindContext("/generatePin(...)");
            ctx.setParameter("id", creds.id).setParameter("pwd", creds.pwd)
            ctx.execute().then(function(){
                return Promise.resolve(ctx.getBoundContext().getObject())
            }).then(function(result){
                if(result.value) authModel.setProperty("/pin",result.value)
            }).catch(function(err){
                console.log(err)
                MessageToast.show(err.message)
            })
        },

        createOdataModel:function(svcUrl){
            var host = window.localStorage.getItem("backend") || 'https://backend.slova.cc'
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
