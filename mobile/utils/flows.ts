import { LoginPage } from '../pages/LoginPage';
import { MenuPage } from '../pages/MenuPage';
import { ProductsPage } from '../pages/ProductsPage';
import { users } from '../test-data/users';

export const menuPage = new MenuPage();
export const loginPage = new LoginPage();
export const productsPage = new ProductsPage();

export async function loginAsValidUser(): Promise<void> {
  await menuPage.openLogin();
  await loginPage.login(users.valid.username, users.valid.password);
  await productsPage.verifyVisible();
}
