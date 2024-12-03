# Capacitor stuff

Rather straightforward, but upgrade to v6 is impossible without switching to another barcode scanner plugin.

``npm run build`` hopefully produces proper dist folder to do cap sync (almost, see below)

## ui5 build
We assume that ui5 cli v4 is used where build tasks are changed.

### sap/ui/core/library-preload.js patch
After the build ``doCheckVersionHeader`` method of odata v4 _Requestor **must** be patched to deal with cors:
``if(n==="4.0"||!n&&r)`` => ``if(n==="4.0"||true)``
