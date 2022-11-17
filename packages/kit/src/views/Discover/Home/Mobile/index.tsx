import { FC, useContext } from 'react';

import { Box } from '@onekeyhq/components';

import { DiscoverContext } from '../context';

import { Mine } from './Mine';
import { Others } from './Others';
import { Beta } from './Beta'

import platformEnv from '@onekeyhq/shared/src/platformEnv';

export const Android = () => {
  const { categoryId } = useContext(DiscoverContext);
  return (
    <Box flex="1" bg="background-default">
      {categoryId ? <Others /> : <Mine />}
    </Box>
  );
}

export const IosContent = () => {
  return (
    <Box flex="1" bg="background-default">
      <Beta></Beta>
    </Box>
  )
}

export const Mobile: FC = () => {
  return platformEnv.isNativeIOS ? <IosContent /> : <Android></Android>;
};
