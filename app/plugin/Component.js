sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
	"flpPlugin/lib/qrcode"
], function (UIComponent, Fragment, JSONModel, MessageToast) {
    "use strict";

    var dialogPromise;

    return UIComponent.extend("flpPlugin.Component", {

        metadata: { manifest: "json" },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            var i18n = this.getModel("i18n")
            var authModel = new JSONModel({ "user":"", "pin":"" })

            dialogPromise = Fragment.load({
                name: "flpPlugin.fragment.User",
                controller: this
            }).then(function(dlg){
                dlg.setModel(i18n,"i18n");
                dlg.setModel(authModel, "auth")
                dlg.getEndButton().attachPress(function(){ dlg.close(); })
                return Promise.resolve(dlg)
            });

            var self=this;
            sap.ushell.Container.getRenderer("fiori2").addUserAction({
                controlType: "sap.m.Button",
                oControlProperties: {
                    text: i18n.getResourceBundle().getText("FLPUserActionButtonText"),
                    icon: "sap-icon://customer",
                    press: function() { dialogPromise.then(function(dialog) { 
                        dialog.open() }); 
                        self.syncAuthData(authModel)
                    }
                },
                bIsVisible: true,
                bCurrentState: false
            });
        },

        syncAuthData:function(authModel, auth){
            if(!auth) {
                auth = JSON.parse(window.localStorage.getItem("auth") || '{}') 
            }
            if (!auth.user) auth.user = authModel.getProperty("/user")
            if (!auth.id) auth.id = auth.pwd = auth.user
            authModel.setData(auth)
            window.localStorage.setItem("auth",JSON.stringify(auth))
            var self=this;
            window.setTimeout(function(){ self.genQR(auth.id, auth.pwd, auth.user); }, 100)
        },

        clearAuthData:function(e){
            window.localStorage.removeItem("auth")
            this.syncAuthData(e.getSource().getModel("auth"))
        },

        generateUser:function(){
            var self = this;
            var odata = this.getModel()
            var authModel;
            var ctx;
            dialogPromise.then(function(dlg){
                authModel=dlg.getModel("auth")
                ctx = odata.bindContext("/generateUser(...)");
                return ctx.execute()
            }).then(function(){
                return Promise.resolve(ctx.getBoundContext().getObject())
            }).then(function(auth){
                delete auth["@odata.context"];
                self.syncAuthData(authModel, auth)
            }).catch(function(err){
                MessageToast.show(err.message)
                console.log(err)
            })
        },

        fetchCreds:function(){
            var self = this;
            var odata = this.getModel()
            var authModel;
            var ctx;
            dialogPromise.then(function(dlg){
                authModel=dlg.getModel("auth")
                var data = authModel.getData();
                ctx = odata.bindContext("/fetchCreds(...)");
                ctx.setParameter("name", data.user).setParameter("pin", data.pin)
                return ctx.execute()
            }).then(function(){
                return Promise.resolve(ctx.getBoundContext().getObject());
            }).then(function(auth){
                if (!auth.pwd) return Promise.reject(new Error('Empty fetch result'))
                delete auth["@odata.context"];
                authModel.setProperty("/pin","");
                self.syncAuthData(authModel, auth)
            }).catch(function(err){
                MessageToast.show(err.message)
                console.log(err)
            })
        },

        genQR:function(id, pwd, user){
            $('#qrcode')[0].innerHTML=''; // clear div
			new QRCode("qrcode", {
				text: JSON.stringify({ id:id, pwd:pwd, user:user }),
				width: 250,
				height: 250,
				colorDark: "#000000",
				colorLight: "#ffffff",
				correctLevel: QRCode.CorrectLevel.H
			});
        }
        
    });
});