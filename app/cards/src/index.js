import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Clipboard } from '@capacitor/clipboard';

window.startScan = async () => {

    await BarcodeScanner.checkPermission({ force: true });

    BarcodeScanner.hideBackground();

    document.querySelector('html').classList.add('scanner-active');
    document.querySelector('body').classList.remove('sapUiBody');

    const result = await BarcodeScanner.startScan();

    document.querySelector('html').classList.remove('scanner-active');
    document.querySelector('body').classList.add('sapUiBody');

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

window.writeToClipboard = async (value) => {
    await Clipboard.write({ string: value });
};

window.readFromClipboard = async () => {
    const { type, value } = await Clipboard.read();
    return type == 'text/plain' ? value : ''
};