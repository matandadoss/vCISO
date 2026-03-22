const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.error(`[BROWSER UNCAUGHT]: ${err.message}`);
  });
  
  page.on('requestfailed', request => {
    console.error(`[NETWORK FAILED] ${request.url()}: ${request.failure()?.errorText}`);
  });

  console.log("Navigating to https://vciso-frontend-457240052356.us-central1.run.app/...");
  await page.goto('https://vciso-frontend-457240052356.us-central1.run.app/', { waitUntil: 'networkidle2', timeout: 30000 });
  
  console.log("Wait complete. Closing...");
  await browser.close();
})();
