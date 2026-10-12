import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Turns the file path into a file:/// URL that works on any OS
const APP = pathToFileURL(path.resolve('app/sajilo-bazaar.html')).href;

test('buy a Dhaka Topi and Ilam tea with eSewa', async ({ page }) => {
  await page.goto(APP);

  // Step 1: wait for the products to finish loading
  const products = page.getByRole('list', {name: 'Products'}).getByRole('listitem');
  await expect(products).toHaveCount(6);

  //Step 2: add two items and watch the cart badge update
  await products.filter({hasText: 'Dhaka Topi'}).getByRole('button',{name: 'Add to cart'}).click();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
  await products.filter({hasText: 'Ilam Orthodox Tea'}).getByRole('button', {name: 'Add to cart'}).click();
  await expect(page.getByTestId('cart-count')).toHaveText('2');

  // Step 3: choose delivery, then validate every number in the summary
  await page.getByLabel('Delivery area').selectOption({ label: 'Inside Kathmandu Valley' });
  await expect(page.getByTestId('subtotal')).toHaveText('Rs 1,450.00');
  await expect(page.getByTestId('delivery-fee')).toHaveText('Rs 100.00');
  await expect(page.getByTestId('order-total')).toHaveText('Rs 1,550.00');

  // Step 4: check out and pay inside the eSewa iframe
  await page.getByRole('button', { name: 'Proceed to checkout' }).click();
  const esewa = page.frameLocator('iframe[title="eSewa payment"]');
  await expect(esewa.getByTestId('pay-amount')).toHaveText('Rs 1,550.00');
  await esewa.getByLabel('eSewa ID').fill('9841234567');
  await esewa.getByLabel('MPIN').fill('1234');
  await esewa.getByRole('button', { name: 'Pay now' }).click();

  // Step 5: confirm the order on the main page
  await expect(page.getByRole('heading', { name: 'Order placed!' })).toBeVisible();
  await expect(page.getByTestId('order-id')).toHaveText(/^SB-\d{6}$/);
  await expect(page.getByTestId('paid-amount')).toHaveText('Rs 1,550.00');
});

test('P1 - add a lokta paper notebook and prove the toast appeared and dissapeared', async ({ page }) => {
    await page.goto(APP);
    // Step 1: wait for the products to finish loading
    const products = page.getByRole('list', {name: 'Products'}).getByRole('listitem');
    await expect(products).toHaveCount(6);

    //add a lokta paper notebook. Prove the message appeared, then disappeared
    await products.filter({hasText: 'Lokta Paper Notebook'}).getByRole('button', {name: 'Add to cart'}).click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    const toast = page.getByRole('status');
    await expect(toast).toHaveText('Lokta Paper Notebook added to cart');
    await expect(toast).toBeHidden(); // gone after 2.5 sec
});


test('P2 - Singing Bowl becomes sold out', async ({ page }) => {
  await page.goto(APP);

  // Wait until all six products have loaded
  const products = page.getByRole('list', { name: 'Products' }).getByRole('listitem');
  await expect(products).toHaveCount(6);

  // Find the Singing Bowl product card
  const singingBowl = products.filter({hasText: 'Singing Bowl'})

  // Click its Add to cart button
  await singingBowl.getByRole('button', { name: 'Add to cart' }).click();

  // The cart should contain one item
  await expect(page.getByTestId('cart-count')).toHaveText('1');

  // The button should now say Sold out and be disabled
  const soldOutButton = singingBowl.getByRole('button', {name: 'Sold out'});

  await expect(soldOutButton).toBeDisabled();
});

test('P3 - update quantities and verify totals', async({page}) =>{
    await page.goto(APP);

    const products = page.getByRole('list', {name: 'Products'}).getByRole('listitem');
    await expect(products).toHaveCount(6);

    products.filter({hasText: 'Pashmina Shawl'}).getByRole('button', {name: 'Add to cart'}).click();
    products.filter({hasText: 'Gundruk'}).getByRole('button', {name: 'Add to cart'}).click();

    // find gundruk's cart row
    const gundruk = page.getByRole('row', {name: /Gundruk/});

    //increase the quantity of gundruk from 1 to 2
    await gundruk.getByRole('button', {name: 'Increase Quantity' }).click();
    await expect(gundruk.getByTestId('qty')).toHaveText('2');

    //increase the quantity of gundruk from 2 to 3
    await gundruk.getByRole('button', {name: 'Increase Quantity' }).click();
    await expect(gundruk.getByTestId('qty')).toHaveText('3');

    //check the total amt for 3 qty of gundruk
    //180 x 3 = 540
    await expect(gundruk.getByTestId('line-total')).toHaveText('Rs 540.00');

    // one pashmina shawl + three gundruk = four items
    await expect(page.getByTestId('cart-count')).toHaveText('4');

    //Delivery area
    await page.getByLabel('Delivery area').selectOption({ label: 'Inside Kathmandu Valley' });

    await expect(page.getByTestId('subtotal')).toHaveText('Rs 5,040.00');
    await expect(page.getByTestId('delivery-fee')).toHaveText('Rs 100.00');
    await expect(page.getByTestId('order-total')).toHaveText('Rs 5,140.00');

    await page.getByRole('button', {name: 'Proceed to checkout'}).click();
});

test('P4 - invalid promo code', async({page}) =>{
    await page.goto(APP);

    const products = page.getByRole('list', {name: 'Products'}).getByRole('listitem');
    await expect(products).toHaveCount(6);

    const pashmina =  products.filter({hasText: 'Pashmina Shawl'});

    await pashmina.getByRole('button', {name: 'Add to cart'}).click();

    //Delivery area
    await page.getByLabel('Delivery area').selectOption({ label: 'Inside Kathmandu Valley' });

    //Invalid Promo code
    await page.getByLabel('Promo code').fill('DASHAIN1011');
    await page.getByRole('button', {name: 'Apply'}).click();
    let promoError = 'Sorry, that code is not valid.';
    await expect(page.getByTestId('promo-message')).toHaveText(promoError);

    await expect(page.getByTestId('subtotal')).toHaveText('Rs 4,500.00');
    await expect(page.getByTestId('delivery-fee')).toHaveText('Rs 100.00');
    await expect(page.getByTestId('discount')).toHaveText('Rs 0.00');
    await expect(page.getByTestId('order-total')).toHaveText('Rs 4,600.00');

    //valid Promo code
    await page.getByLabel('Promo code').fill('DASHAIN10');
    await page.getByRole('button', {name: 'Apply'}).click();
    let promoMessage = 'DASHAIN10 applied: 10% off your items';
    await expect(page.getByTestId('promo-message')).toHaveText(promoMessage);

    await expect(page.getByTestId('subtotal')).toHaveText('Rs 4,500.00');
    await expect(page.getByTestId('delivery-fee')).toHaveText('Rs 100.00');
    await expect(page.getByTestId('discount')).toHaveText('Rs 450.00');
    await expect(page.getByTestId('order-total')).toHaveText('Rs 4,150.00');

    await page.getByRole('button', {name: 'Proceed to checkout'}).click();

    const esewa = page.frameLocator('iframe[title="eSewa payment"]');
    await expect(esewa.getByTestId('pay-amount')).toHaveText('Rs 4,150.00');
    await esewa.getByLabel('eSewa ID').fill('9841234567');
    await esewa.getByLabel('MPIN').fill('1234');
    await esewa.getByRole('button', { name: 'Pay now' }).click();
    
    // Back on the main page: no frame needed
    await expect(page.getByRole('heading', { name: 'Order placed!' })).toBeVisible();
});

test('P5 - cancel and confirm item removal', async({page}) =>{
    await page.goto(APP);

    const products = page.getByRole('list', {name: 'Products'}).getByRole('listitem');
    await expect(products).toHaveCount(6);

    await products.filter({ hasText: 'Lokta Paper Notebook' }).getByRole('button', { name: 'Add to cart' }).click();

    const toast = page.getByRole('status');
    await expect(toast).toHaveText('Lokta Paper Notebook added to cart');
    await expect(toast).toBeHidden(); 

    await expect(page.getByTestId('cart-count')).toHaveText('1');

    //first: cancel the removal
    page.once('dialog', async dialog => {
        await dialog.dismiss();//cancel
    });
    await page.getByRole('button', {name: 'Remove'}).click(); //Then click the button
    
    //the item should remain in the cart
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    //second attempt: confirm the removal
    page.once('dialog', async dialog =>{
        await dialog.accept(); // OK
    });
    await page.getByRole('button', {name: 'Remove'}).click();

    //the cart should be empty now
    await expect(page.getByText('Your cart is empty.')).toBeVisible();
    await expect(page.getByTestId('cart-count')).toHaveText('0');
});

