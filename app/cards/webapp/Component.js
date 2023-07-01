sap.ui.define(["sap/fe/core/AppComponent","sap/ui/model/odata/v4/ODataModel",], function (Component, ODataModel) {
    "use strict";

    return Component.extend("customCards.Component", {

        metadata: {
            manifest: "json"
        },
        
        init: function () {
            var compData = this.getComponentData()
            if (compData && compData.mobile) this.setModel(this.createOdataModel(this.getAuth()))
            Component.prototype.init.apply(this, arguments);
        },

        getAuth:function(){
            var auth = window.localStorage.getItem("auth")
            if (!auth) {
                var user = prompt('user')
                auth = btoa(user+":"+user)
            }
            return auth
        },

        createOdataModel:function(auth){
            var svcUrl = this.getManifestEntry("sap.app").dataSources.mainService.uri
            var host = window.localStorage.getItem("backend") || 'http://localhost:4004'
            return new ODataModel({
                "serviceUrl": host + svcUrl,
                "synchronizationMode": "None",
                "operationMode": "Server",
                "autoExpandSelect": true,
                "earlyRequests": false,
                "httpHeaders" : { "Authorization" : "Basic " + auth }
            })
        }

    });
});
