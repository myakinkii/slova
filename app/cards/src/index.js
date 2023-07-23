import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

window.startScan = async () => {

    await BarcodeScanner.checkPermission({ force: true });

    BarcodeScanner.hideBackground();

    document.querySelector('html').classList.add('scanner-active');

    const result = await BarcodeScanner.startScan();

    document.querySelector('html').classList.remove('scanner-active');

    if (result.hasContent) {
        try {
            const creds = JSON.parse(result.content)
            if (!creds.id || !creds.pwd) throw new Error()
            return creds
        } catch (e) {
            throw new Error('INVALID_CODE')
        }
    }
};