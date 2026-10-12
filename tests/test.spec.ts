import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Turns the file path into a file:/// URL that works on any OS
const APP = pathToFileURL(path.resolve('app/sajilo-bazaar.html')).href;

test('shop loads six products', async ({ page }) => {
  await page.goto(APP);
  // await page.pause(); //debugging
  const products = page.getByRole('list', { name: 'Products' })
    .getByRole('listitem');
  await expect(products).toHaveCount(6);
});

// test('add a product to cart', async ({page}) => {
//   await page.goto(APP);
//   const products = page.getByRole('list', { name: 'Products' })
//     .getByRole('listitem');
//   await products.filter({ hasText: 'Lokta Paper Notebook' })
//   .getByRole('button', { name: 'Add to cart' }).click();

// const toast = page.getByRole('status');
// await expect(toast).toHaveText('Lokta Paper Notebook added to cart');
// await expect(toast).toBeHidden();   // gone after about 2.5 s
// })

// test('busy button', async({page})=>{
//   await page.goto(APP);
//   const products = page.getByRole('list', { name: 'Products' })
//     .getByRole('listitem');
//   const bowl = products.filter({ hasText: 'Singing Bowl' });
// await bowl.getByRole('button', { name: 'Add to cart' }).click();

// // Assert the end state, not the short-lived "Adding..." in between
// await expect(page.getByTestId('cart-count')).toHaveText('1');
// await expect(bowl.getByRole('button', { name: 'Sold out' })).toBeDisabled();
// })

test('remove empties the cart', async ({ page }) => {
  await page.goto(APP);
  const products = page.getByRole('list', { name: 'Products' })
    .getByRole('listitem');
  await products.filter({ hasText: 'Dhaka Topi' })
    .getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByTestId('cart-count')).toHaveText('1');

  // await page.getByRole('button', { name: 'Remove' }).click();
  // await expect(page.getByText('Your cart is empty.')).toBeVisible();

  page.once('dialog', dialog => dialog.accept());   // answer the confirm with OK
await page.getByRole('button', { name: 'Remove' }).click();
await expect(page.getByText('Your cart is empty.')).toBeVisible();
});