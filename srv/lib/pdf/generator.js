const fs = require('fs')

const Handlebars = require('handlebars')
const templateSource = fs.readFileSync(`${__dirname}/template.handlebars`, 'utf-8')
const template = Handlebars.compile(templateSource)

const puppeteer = require('puppeteer')
const browser = puppeteer.launch() // kinda promise here

const { PDFDocument } = require('pdf-lib')

const makeCardsFor = async (words) => {

    const mergedPdf = await PDFDocument.create()

    // await Promise.all(words.map( async(word) => {
    for (let word of words){ // one by one instead of parallel to use less ram

        const page = await browser.then( b => b.newPage())
        await page.setContent(template(word))
        const pdfBytes = await page.pdf({ format: 'A6', printBackground: true })
        await page.close()

        const pdf = await PDFDocument.load(pdfBytes) // can be multipage theoretically
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices()) // from this stuff
        copiedPages.forEach(page => mergedPdf.addPage(page)) // to this stuff
    }

    const mergedPdfBytes = await mergedPdf.save()
    return Buffer.from(mergedPdfBytes).toString('base64')
}

const getEmptyPdf = () => {
    return 'JVBERi0xLjMKJcTl8uXrp/Og0MTGCjMgMCBvYmoKPDwgL0ZpbHRlciAvRmxhdGVEZWNvZGUgL0xlbmd0aCAxMSA+PgpzdHJlYW0KeAErVAgEAAHnAOMKZW5kc3RyZWFtCmVuZG9iagoxIDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgL1Jlc291cmNlcyA0IDAgUiAvQ29udGVudHMgMyAwIFIgL01lZGlhQm94IFswIDAgNTk1LjI3NTYgODQxLjg4OThdCj4+CmVuZG9iago0IDAgb2JqCjw8IC9Qcm9jU2V0IFsgL1BERiBdID4+CmVuZG9iagoyIDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvTWVkaWFCb3ggWzAgMCA1OTUuMjc1NiA4NDEuODg5OF0gL0NvdW50IDEgL0tpZHMgWyAxIDAgUiBdCj4+CmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmoKNiAwIG9iago8PCAvVGl0bGUgKGVtcHR5KSAvUHJvZHVjZXIgKG1hY09TIFZlcnNpb24gMTUuMS4xIFwoQnVpbGQgMjRCOTFcKSBRdWFydHogUERGQ29udGV4dCkKL0F1dGhvciAoQWxleCBNeWFraW5raWkpIC9DcmVhdG9yIChUZXh0RWRpdCkgL0NyZWF0aW9uRGF0ZSAoRDoyMDI1MDEyNzEzMTgxOFowMCcwMCcpCi9Nb2REYXRlIChEOjIwMjUwMTI3MTMxODE4WjAwJzAwJykgPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDEwNCAwMDAwMCBuIAowMDAwMDAwMjU3IDAwMDAwIG4gCjAwMDAwMDAwMjIgMDAwMDAgbiAKMDAwMDAwMDIxOCAwMDAwMCBuIAowMDAwMDAwMzUwIDAwMDAwIG4gCjAwMDAwMDAzOTkgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA3IC9Sb290IDUgMCBSIC9JbmZvIDYgMCBSIC9JRCBbIDxiZjZmNjI2YmE5MTk3Nzk3YmExMTU4NTljZTliZjFiMz4KPGJmNmY2MjZiYTkxOTc3OTdiYTExNTg1OWNlOWJmMWIzPiBdID4+CnN0YXJ0eHJlZgo2MjIKJSVFT0YK'
}

module.exports = {
    getEmptyPdf,
    makeCardsFor
}