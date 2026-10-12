import { expectKnownIssue, restartApp, terminateApp } from '../utils/app';
import { loginPage, menuPage, productsPage } from '../utils/flows';
import { Logger } from '../utils/logger';
import { messages } from '../test-data/messages';
import { payloads, users } from '../test-data/users';

const logger = new Logger('LoginSuite');

describe('Login', () => {
  before(async () => {
    logger.info('Login suite started');
    await restartApp();
  });

  after(async () => {
    await terminateApp();
    logger.info('Login suite finished');
  });

  beforeEach(async () => {
    await restartApp();
  });

  it('TC_MOB_LOGIN_001 @smoke @regression login screen shows username, password and login controls', async () => {
    await menuPage.openLogin();
    await loginPage.verifyVisible();
  });

  it('TC_MOB_LOGIN_002 @smoke @regression Login is reachable from the menu while logged out', async () => {
    await menuPage.open();
    await menuPage.verifyLoginItemVisible();
    await menuPage.verifyLogoutItemAbsent();
    await menuPage.tapLogin();
    await loginPage.verifyVisible();
  });

  it('TC_MOB_LOGIN_003 @smoke @regression valid credentials open the products screen', async () => {
    await menuPage.openLogin();
    await loginPage.login(users.valid.username, users.valid.password);
    await productsPage.verifyVisible();
    await menuPage.open();
    await menuPage.verifyLogoutItemVisible();
  });

  it('TC_MOB_LOGIN_004 @smoke @regression password is masked', async () => {
    await menuPage.openLogin();
    await loginPage.enterPassword(users.valid.password);
    await loginPage.verifyPasswordMasked();
  });

  it('TC_MOB_LOGIN_005 @regression tapping a listed username fills both fields', async () => {
    await menuPage.openLogin();
    await loginPage.tapListedBodUser();
    await loginPage.verifyUsernameFilled(users.valid.username);
    await loginPage.verifyPasswordFilled();
  });

  it('TC_MOB_LOGIN_006 @smoke @negative @regression both fields empty shows only username required', async () => {
    await menuPage.openLogin();
    await loginPage.login('', '');
    await loginPage.verifyUsernameError(messages.usernameRequired);
    await loginPage.verifyNoPasswordError();
  });

  it('TC_MOB_LOGIN_007 @negative @regression empty password shows a password error', async () => {
    await menuPage.openLogin();
    await loginPage.login(users.valid.username, '');
    await loginPage.verifyPasswordError(messages.passwordRequired);
  });

  it('TC_MOB_LOGIN_008 @negative @regression empty username shows username required', async () => {
    await menuPage.openLogin();
    await loginPage.login('', users.valid.password);
    await loginPage.verifyUsernameError(messages.usernameRequired);
  });

  it('TC_MOB_LOGIN_009 @negative @regression @known-issue wrong password is rejected', async () => {
    await menuPage.openLogin();
    await expectKnownIssue('D-M1: the app accepts any non-empty credentials', async () => {
      await loginPage.login(users.wrongPassword.username, users.wrongPassword.password);
      await loginPage.verifyLoginRejected();
    });
  });

  it('TC_MOB_LOGIN_010 @negative @regression @known-issue unknown user with wrong password is rejected', async () => {
    await menuPage.openLogin();
    await expectKnownIssue('D-M1: the app accepts any non-empty credentials', async () => {
      await loginPage.login(users.unknown.username, users.unknown.password);
      await loginPage.verifyLoginRejected();
    });
  });

  it('TC_MOB_LOGIN_011 @smoke @negative @regression locked out user is rejected', async () => {
    await menuPage.openLogin();
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    await loginPage.verifyPasswordError(messages.lockedOut);
  });

  it('TC_MOB_LOGIN_015 @security @known-issue authenticated content is not shown before login', async () => {
    await expectKnownIssue('D-M2: the app opens on Products without login', async () => {
      await productsPage.verifyNotVisible();
    });
  });

  it('TC_MOB_LOGIN_016 @regression checkout without login redirects to the login screen', async () => {
    await productsPage.addFirstProductToCart();
    await productsPage.openCart();
    await productsPage.proceedToCheckout();
    await loginPage.verifyVisible();
  });

  it('TC_MOB_LOGIN_018 @negative @regression whitespace-only credentials count as empty', async () => {
    await menuPage.openLogin();
    await loginPage.login(payloads.whitespace, payloads.whitespace);
    await loginPage.verifyUsernameError(messages.usernameRequired);
  });

  it('TC_MOB_LOGIN_019 @security @negative @known-issue SQL injection does not bypass login', async () => {
    await menuPage.openLogin();
    await expectKnownIssue('D-M1: the app accepts any non-empty credentials', async () => {
      await loginPage.login(payloads.sql, payloads.sql);
      await loginPage.verifyLoginRejected();
    });
  });
});
