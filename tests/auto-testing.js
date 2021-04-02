const { join } = require('path');
const puppeteer = require('puppeteer');


const extensionDir = join(__dirname, "..", "manifest.json", "resides");

console.log(extensionDir);

puppeteer.launch({
    headless: false,
    args: [
        '--load-extension="' + extensionDir + '"',
        '--disable-extensions-except="' + extensionDir + '"'
    ]
}).then(async browser => {

    const page = await browser.newPage();
    await page.goto('https://example.com');


    // await browser.close();
    
});
