import { driver } from '@wdio/globals';
import { LogoutDialog } from '../pages/LogoutDialog';
import { bringAppToFront, restartApp, terminateApp } from '../utils/app';
import { loginAsValidUser, loginPage, menuPage } from '../utils/flows';
import { Logger } from '../utils/logger';

const logoutDialog = new LogoutDialog();
const logger = new Logger('LogoutSuite');

describe('Logout', () => {
  before(async () => {
    logger.info('Logout suite started');
    await restartApp();
  });

  after(async () => {
    await terminateApp();
    logger.info('Logout suite finished');
  });

  beforeEach(async () => {
    await restartApp();
    await loginAsValidUser();
  });

  it('TC_MOB_LOGIN_012 @smoke @regression logout returns to a clean login screen', async () => {
    await menuPage.open();
    await menuPage.tapLogout();
    await logoutDialog.verifyVisible();
    await logoutDialog.confirm();
    await loginPage.verifyVisible();
    await loginPage.verifyFieldsEmpty();
  });

  it('TC_MOB_LOGIN_013 @regression cancelling logout keeps the user logged in', async () => {
    await menuPage.open();
    await menuPage.tapLogout();
    await logoutDialog.cancel();
    await logoutDialog.verifyClosed();
    await menuPage.open();
    await menuPage.verifyLogoutItemVisible();
  });

  it('TC_MOB_LOGIN_014 @regression menu offers Log In again after logout', async () => {
    await menuPage.open();
    await menuPage.tapLogout();
    await logoutDialog.confirm();
    await menuPage.open();
    await menuPage.verifyLoginItemVisible();
    await menuPage.verifyLogoutItemAbsent();
  });

  it('TC_MOB_LOGIN_017 @security @regression Back after logout does not restore the session', async () => {
    await menuPage.open();
    await menuPage.tapLogout();
    await logoutDialog.confirm();
    await loginPage.verifyVisible();

    await driver.back();
    await bringAppToFront();

    await menuPage.open();
    await menuPage.verifyLoginItemVisible();
  });
});
