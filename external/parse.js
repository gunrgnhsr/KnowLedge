const { PDFExtract } = require('pdf.js-extract');
const pdfExtract = new PDFExtract();
const options = {}; /* see below */
pdfExtract.extract('c:/Users/admin/Desktop/proj/knowledge/external/קלאסית_1.pdf', options, (err, data) => {
    if (err) return console.log(err);

    let text = '';
    data.pages.forEach(page => {
        page.content.forEach(item => {
            text += item.str + ' ';
        });
        text += '\n';
    });
    console.log(text.substring(0, 4000));
});
