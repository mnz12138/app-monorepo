import debugLogger from '@onekeyhq/shared/src/logger/debugLogger';
import InAppReview from 'react-native-in-app-review';
import simpleDb from '@onekeyhq/engine/src/dbs/simple/simpleDb';

export const openAppReview = async () => {
  const isAvailable = InAppReview.isAvailable();
  debugLogger.common.info('react-native-in-app-review is available', isAvailable)
  if (!isAvailable) { return }
  const lastOpenedAt = await simpleDb.setting.getAppReviewsLastOpenedAt()
  if (Date.now() - lastOpenedAt < 1000 * 60 * 60 * 24 * 60) {
    return
  }
  let hasFlowFinishedSuccessfully: boolean = false;
  try {
    hasFlowFinishedSuccessfully = await InAppReview.RequestInAppReview();
  } catch (e: any) {
    debugLogger.common.info('react-native-in-app-review error', e.message)
    return
  }
  await simpleDb.setting.setAppReviewsLastOpenedAt(Date.now())
  debugLogger.common.info('hasFlowFinishedSuccessfully', hasFlowFinishedSuccessfully)
}