import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  page.on('console', (msg) => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
  console.log('Page loaded');

  // Click the manual tab (third button in platform-tabs)
  const tabs = await page.$$('.platform-tabs button');
  if (tabs.length >= 3) {
    await tabs[2].click();
    console.log('Clicked manual tab');
  } else {
    console.log('ERROR: Found only', tabs.length, 'tabs');
  }

  await page.waitForTimeout(500);

  // Take screenshot before
  await page.screenshot({ path: 'test-before.png' });
  console.log('Screenshot before: test-before.png');

  // Fill the form
  // Date input
  await page.fill('.manual-form-field input[type="date"]', '2026-06-05');
  // Amount
  const amountInput = await page.$('.manual-form-field input[type="number"][min="0"][step="0.01"]');
  if (amountInput) {
    await amountInput.fill('100');
  }
  // Qty (second number input)
  const numInputs = await page.$$('.manual-form-field input[type="number"]');
  if (numInputs.length >= 2) {
    await numInputs[1].fill('2');
  }
  // Product name
  const textInputs = await page.$$('.manual-form-field input[type="text"]');
  if (textInputs.length >= 1) {
    await textInputs[0].fill('Test Product');
  }
  // Cost (third number input)
  if (numInputs.length >= 3) {
    await numInputs[2].fill('30');
  }
  // Platform fee (fourth number input)
  if (numInputs.length >= 4) {
    await numInputs[3].fill('5');
  }

  console.log('Form filled');

  // Click the Add button
  const addBtn = await page.$('.manual-add-btn');
  if (addBtn) {
    await addBtn.click();
    console.log('Clicked Add button');
  } else {
    console.log('ERROR: Add button not found');
  }

  await page.waitForTimeout(500);

  // Check if order appears in the list
  const orderRows = await page.$$('.manual-order-list tbody tr');
  console.log('Order rows in table:', orderRows.length);

  // Check stats
  const statItems = await page.$$('.result-item strong');
  for (let i = 0; i < statItems.length; i++) {
    const text = await statItems[i].textContent();
    console.log(`Stat ${i}:`, text);
  }

  // Take screenshot after
  await page.screenshot({ path: 'test-after.png' });
  console.log('Screenshot after: test-after.png');

  await browser.close();
  console.log('Test complete');
})();
