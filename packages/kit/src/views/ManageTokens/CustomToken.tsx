import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/core';
import { useIntl } from 'react-intl';

import {
  Form,
  KeyboardDismissView,
  Modal,
  useForm,
  useToast,
} from '@onekeyhq/components';
import { useIsVerticalLayout } from '@onekeyhq/components/src/Provider/hooks';
import type { Token } from '@onekeyhq/engine/src/types/token';

import backgroundApiProxy from '../../background/instance/backgroundApiProxy';
import {
  useActiveWalletAccount,
  useDebounce,
  useManageTokens,
  useNetworkSimple,
} from '../../hooks';
import { ModalRoutes, RootRoutes } from '../../routes/routesEnum';

import { ManageTokenRoutes } from './types';

import type { ManageTokenRoutesParams } from './types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type NavigationProps = NativeStackScreenProps<
  ManageTokenRoutesParams,
  ManageTokenRoutes.CustomToken
>;

type AddCustomTokenValues = {
  address: string;
  symbol: string;
  decimal: string;
};

export const AddCustomToken: FC<NavigationProps> = ({ route }) => {
  const address = route.params?.address;
  const networkId = route.params?.networkId;
  const intl = useIntl();
  const toast = useToast();
  const navigation = useNavigation();
  const [isSearching, setSearching] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const {
    walletId,
    account: activeAccount,
    network: defaultNetwork,
  } = useActiveWalletAccount();
  const activeNetwork = useNetworkSimple(networkId ?? null, defaultNetwork);
  const { accountTokensMap } = useManageTokens();
  const isSmallScreen = useIsVerticalLayout();

  const helpTip = intl.formatMessage({
    id: 'form__searching_token',
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isValid },
    trigger,
    setError,
    watch,
  } = useForm<AddCustomTokenValues>({
    defaultValues: { address: '', symbol: '', decimal: '' },
    mode: 'onChange',
  });

  useEffect(() => {
    if (address) {
      setValue('address', address);
    }
  }, [address, setValue]);

  const watchedAddress = watch('address');
  const debouncedAddress = useDebounce(watchedAddress, 1000);

  const onAddToken = useCallback(
    async (accountId: string, $networkId: string, $address: string) => {
      const result = await backgroundApiProxy.serviceToken.addAccountToken(
        $networkId,
        accountId,
        $address,
      );
      if (result) {
        toast.show({
          title: intl.formatMessage({
            id: 'msg__token_added',
            defaultMessage: 'Token Added',
          }),
        });
        backgroundApiProxy.serviceToken.fetchTokenBalance({
          activeAccountId: accountId,
          activeNetworkId: $networkId,
        });
        if (navigation?.canGoBack?.()) {
          navigation.goBack();
        }
      }
    },
    [intl, navigation, toast],
  );

  const onSubmit = useCallback(
    async (data: AddCustomTokenValues) => {
      if (activeNetwork && activeAccount) {
        const $accountId = activeAccount.id;
        const $networkId = activeNetwork.id;
        const tokenId = data.address;

        const vaultSettings = await backgroundApiProxy.engine.getVaultSettings(
          activeNetwork.id,
        );
        if (vaultSettings?.activateTokenRequired) {
          navigation.navigate(RootRoutes.Modal, {
            screen: ModalRoutes.ManageToken,
            params: {
              screen: ManageTokenRoutes.ActivateToken,
              params: {
                walletId,
                accountId: $accountId,
                networkId: $networkId,
                tokenId,
                onSuccess() {
                  onAddToken($accountId, $networkId, tokenId);
                },
              },
            },
          });
        } else {
          onAddToken($accountId, $networkId, tokenId);
        }
      }
    },
    [activeNetwork, activeAccount, navigation, walletId, onAddToken],
  );

  const onSearch = useCallback(
    (token?: Token) => {
      if (token) {
        setValue('decimal', String(token.decimals));
        setValue('symbol', token.symbol);
        setInputDisabled(true);
        trigger('address');
      } else {
        setError('address', {
          message: intl.formatMessage({ id: 'msg__wrong_address_format' }),
        });
        setInputDisabled(false);
        setValue('decimal', '');
        setValue('symbol', '');
      }
    },
    [setValue, trigger, setError, intl],
  );

  useEffect(() => {
    async function doQuery() {
      if (!activeNetwork) return;
      const normalizeTokenAddress =
        await backgroundApiProxy.validator.normalizeTokenAddress(
          activeNetwork?.id,
          debouncedAddress,
        );

      if (
        !accountTokensMap.has(normalizeTokenAddress) &&
        activeAccount &&
        normalizeTokenAddress
      ) {
        let preResult;
        setSearching(true);
        try {
          preResult = await backgroundApiProxy.engine.preAddToken(
            activeAccount.id,
            activeNetwork.id,
            normalizeTokenAddress,
          );
          if (preResult?.[1]) {
            onSearch(preResult?.[1]);
          } else {
            onSearch(undefined);
          }
        } catch (e) {
          console.error(e);
          onSearch(undefined);
        } finally {
          setSearching(false);
        }
      }
    }
    doQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, activeAccount, activeNetwork, onSearch, debouncedAddress]);

  return (
    <Modal
      header={intl.formatMessage({
        id: 'action__add_custom_tokens',
        defaultMessage: 'Add Custom Token',
      })}
      hideSecondaryAction
      primaryActionTranslationId="action__add"
      primaryActionProps={{
        type: 'primary',
        isDisabled: !isValid && !isSearching,
        onPromise: () => handleSubmit(onSubmit)(),
      }}
    >
      <KeyboardDismissView>
        <Form>
          <Form.Item
            name="address"
            label={intl.formatMessage({
              id: 'transaction__contract_address',
              defaultMessage: 'Contract Address',
            })}
            control={control}
            defaultValue=""
            labelAddon={['paste']}
            helpText={isSearching ? helpTip : undefined}
            rules={{
              required: intl.formatMessage({
                id: 'form__field_is_required',
              }),
              validate: async (value) => {
                if (!activeNetwork) return;

                const normalizeTokenAddress =
                  await backgroundApiProxy.validator.normalizeTokenAddress(
                    activeNetwork?.id,
                    value,
                  );
                if (accountTokensMap.has(normalizeTokenAddress)) {
                  return intl.formatMessage({
                    id: 'msg__token_already_existed',
                  });
                }
              },
            }}
          >
            <Form.Textarea
              trimValue
              placeholder={intl.formatMessage({
                id: 'form__enter_or_paste_contract_address',
                defaultMessage: 'Enter or paste contract address',
              })}
            />
          </Form.Item>
          <Form.Item
            name="symbol"
            label={intl.formatMessage({
              id: 'form__token_symbol',
              defaultMessage: 'Token Symbol',
            })}
            rules={{
              required: intl.formatMessage({
                id: 'form__field_is_required',
              }),
            }}
            defaultValue=""
            control={control}
          >
            <Form.Input
              size={isSmallScreen ? 'xl' : 'default'}
              isDisabled={inputDisabled}
            />
          </Form.Item>
          <Form.Item
            name="decimal"
            label={intl.formatMessage({
              id: 'form__decimal',
              defaultMessage: 'Decimal',
            })}
            control={control}
            defaultValue=""
            rules={{
              required: intl.formatMessage({
                id: 'form__field_is_required',
              }),
            }}
          >
            <Form.Input
              size={isSmallScreen ? 'xl' : 'default'}
              isDisabled={inputDisabled}
            />
          </Form.Item>
        </Form>
      </KeyboardDismissView>
    </Modal>
  );
};

export default AddCustomToken;
