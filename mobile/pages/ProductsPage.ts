import { $$, expect } from '@wdio/globals';
import { messages } from '../test-data/messages';
import { describeError } from '../utils/logger';
import { BasePage, ElementLocator } from './BasePage';

export class ProductsPage extends BasePage {
  readonly title: ElementLocator;
  readonly cartButton: ElementLocator;
  readonly addToCartButton: ElementLocator;
  readonly proceedToCheckoutButton: ElementLocator;

  constructor() {
    super();
    this.title = this.byId('productTV');
    this.cartButton = this.byAccessibilityId('View cart');
    this.addToCartButton = this.byAccessibilityId('Tap to add product to cart');
    this.proceedToCheckoutButton = this.byAccessibilityId('Confirms products for checkout');
  }

  async verifyVisible(): Promise<void> {
    this.logger.info('Verifying the Products screen');
    try {
      await expect(this.title()).toBeDisplayed();
      await expect(this.title()).toHaveText(messages.productsTitle);
      this.logger.info('Products screen verified');
    } catch (error) {
      this.logger.error(`Products screen verification failed: ${describeError(error)}`);
      throw error;
    }
  }

  async verifyNotVisible(): Promise<void> {
    this.logger.info('Verifying the Products screen is not shown');
    try {
      await expect(this.title()).not.toBeDisplayed();
      this.logger.info('Products screen is not shown');
    } catch (error) {
      this.logger.error(`Products screen is shown: ${describeError(error)}`);
      throw error;
    }
  }

  async addFirstProductToCart(): Promise<void> {
    this.logger.info('Adding the first product to the cart');
    try {
      const firstProduct = (await $$('~Product Image'))[0];
      await firstProduct.waitForDisplayed();
      await firstProduct.click();
      await this.tap(this.addToCartButton, 'the Add To Cart button');
      this.logger.info('First product added to the cart');
    } catch (error) {
      this.logger.error(`Failed to add the first product to the cart: ${describeError(error)}`);
      throw error;
    }
  }

  async openCart(): Promise<void> {
    this.logger.info('Opening the cart');
    try {
      await this.tap(this.cartButton, 'the cart button');
      this.logger.info('Cart opened');
    } catch (error) {
      this.logger.error(`Failed to open the cart: ${describeError(error)}`);
      throw error;
    }
  }

  async proceedToCheckout(): Promise<void> {
    this.logger.info('Proceeding to checkout');
    try {
      await this.tap(this.proceedToCheckoutButton, 'the Proceed To Checkout button');
      this.logger.info('Checkout requested');
    } catch (error) {
      this.logger.error(`Failed to proceed to checkout: ${describeError(error)}`);
      throw error;
    }
  }
}
