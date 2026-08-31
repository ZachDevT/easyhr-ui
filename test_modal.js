const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/hiring');
  await page.waitForTimeout(2000);
  
  // Find a candidate and click it
  const candidates = await page.$$('text/Alex Johnson');
  if (candidates.length > 0) {
    await candidates[0].click();
    await page.waitForTimeout(1000);
    
    // Go to Emails tab
    const emailsTab = await page.$('text/Emails');
    if (emailsTab) {
      await emailsTab.click();
      await page.waitForTimeout(1000);
      
      // Click Compose Email
      const composeBtn = await page.$('text/Compose Email');
      if (composeBtn) {
        await composeBtn.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: '/tmp/modal_test.png' });
        console.log('Clicked Compose Email and took screenshot!');
      } else {
        console.log('Compose Email button not found');
      }
    } else {
      console.log('Emails tab not found');
    }
  } else {
    console.log('Candidate not found');
  }
  
  await browser.close();
})();
