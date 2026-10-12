import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Turns the file path into a file:/// URL that works on any OS
const APP = pathToFileURL(path.resolve('app/sajilo-bazaar.html')).href;

test('test inside iframe', async ({ page }) => {
  await page.goto(APP);
  await page.pause();

  //add product to cart
  const products = page.getByRole('list', { name: 'Products' })
    .getByRole('listitem');
  const lokta = await products.filter({ hasText: 'Lokta Paper Notebook' });
  await lokta.getByRole('button', { name: 'Add to cart' }).click();

  const toast = page.getByRole('status');
  await expect(toast).toHaveText('Lokta Paper Notebook added to cart');
  await expect(toast).toBeHidden(); // gone after 2.5 sec

//   await page.pause();

  // Assert the end state, not the short-lived "Adding..." in between
  await expect(page.getByTestId('cart-count')).toHaveText('1');
//   await expect(lokta.getByRole('button', { name: 'Sold out' })).toBeDisabled();

  //Delivery area
  await page.getByLabel('Delivery area')
  .selectOption({ label: 'Inside Kathmandu Valley' });
  
  // Right: re-reads until it matches, or 5 s pass
  await expect(page.getByTestId('subtotal')).toHaveText('Rs 350.00');
  await expect(page.getByTestId('delivery-fee')).toHaveText('Rs 100.00');
  await expect(page.getByTestId('order-total')).toHaveText('Rs 450.00');

  await page.getByRole('button', {name: 'Proceed to checkout'}).click();

  const esewa = page.frameLocator('iframe[title="eSewa payment"]');
  await expect(esewa.getByTestId('pay-amount')).toHaveText('Rs 450.00');
  await esewa.getByLabel('eSewa ID').fill('9841234567');
  await esewa.getByLabel('MPIN').fill('1234');
  await esewa.getByRole('button', { name: 'Pay now' }).click();

  // Back on the main page: no frame needed
  await expect(page.getByRole('heading', { name: 'Order placed!' })).toBeVisible();
});