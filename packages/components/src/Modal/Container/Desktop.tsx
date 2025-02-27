/* eslint-disable @typescript-eslint/no-unsafe-call */
import { isValidElement, useEffect, useMemo } from 'react';

import { useNavigation, useNavigationState } from '@react-navigation/core';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';

import { useCloseOnEsc } from '@onekeyhq/kit/src/hooks/useOnKeydown';
import platformEnv from '@onekeyhq/shared/src/platformEnv';

import Box from '../../Box';
import Button from '../../Button';
import HStack from '../../HStack';
import PresenceTransition from '../../PresenceTransition';
import Pressable from '../../Pressable';

import Header from './Header/Header';
import useModalClose from './useModalClose';

import type { ModalProps } from '..';

function modalSizing(modalSize: string | undefined) {
  switch (modalSize) {
    case 'xs':
      return '400px';
    case 'sm':
      return '480px';
    case 'md':
      return '560px';
    case 'lg':
      return '640px';
    case 'xl':
      return '720px';
    case '2xl':
      return '800px';
    default:
      return '';
  }
}

const openedModalStack: boolean[] = [];

const DesktopModal = ({
  children,
  onClose,
  closeable,
  footer,
  primaryActionProps,
  secondaryActionProps,
  primaryActionTranslationId,
  secondaryActionTranslationId,
  hideSecondaryAction,
  hidePrimaryAction,
  onBackActionPress,
  onPrimaryActionPress,
  onSecondaryActionPress,
  header,
  headerShown,
  size,
  height,
  maxHeight,
  headerDescription,
  closeAction,
  closeOnOverlayClick,
  hideBackButton,
  rightContent,
}: ModalProps) => {
  const intl = useIntl();
  const navigation = useNavigation();
  const navIndex = useNavigationState((state) => state?.index);

  const defaultClose = useModalClose({ onClose });
  const enableModalAnimation = useMemo(
    () =>
      // default Navigation animation: packages/kit/src/routes/Root/index.tsx
      platformEnv.isRuntimeBrowser,
    [],
  );
  const close = closeAction || defaultClose;

  useEffect(() => {
    // FIX: backdrop flash when open new Modal in another Modal
    openedModalStack.push(true);
    return () => {
      if (openedModalStack.length) {
        openedModalStack.pop();
      }
    };
  }, []);

  useCloseOnEsc(close);

  return (
    <Box
      testID="DesktopModalWrapper"
      position="absolute"
      top="0px"
      left="0px"
      right="0px"
      bottom="0px"
      justifyContent="center"
      alignItems="center"
    >
      {/* TODO render backdrop by Portal? */}
      {closeOnOverlayClick && (
        <Pressable
          testID="DesktopModalBackdrop"
          _web={{
            // @ts-ignore
            cursor: 'default',
          }}
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          onPress={close}
        >
          <PresenceTransition
            as={Box}
            visible
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
              transition: {
                duration:
                  enableModalAnimation && !openedModalStack?.length ? 80 : 0,
              },
            }}
            // @ts-expect-error
            w="full"
            h="full"
            bg="rgba(0, 0, 0, 0.6)"
          />
        </Pressable>
      )}

      <PresenceTransition
        as={Box}
        visible
        initial={{
          opacity: 0,
          // translateY: 24,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          // translateY: 0,
          scale: 1,
          // TODO show animation when open new Modal in Modal, but not push stack in same Modal
          transition: { duration: enableModalAnimation ? 100 : 0 },
        }}
        testID="DesktopModalContentContainer"
        // @ts-expect-error
        width={modalSizing(size)}
        height={height}
        maxHeight={maxHeight}
        alignSelf="center"
        borderRadius="24px"
        bg="background-default"
        zIndex={1}
      >
        {!!headerShown && (
          <Header
            header={header}
            headerDescription={headerDescription}
            firstIndex={!navIndex}
            hideBackButton={hideBackButton}
            onPressBackButton={() => {
              if (hideBackButton) {
                return;
              }
              if (onBackActionPress) {
                onBackActionPress();
                return;
              }
              if (navigation?.canGoBack?.()) {
                navigation.goBack();
              }
            }}
            closeable={closeable}
            onPressCloseButton={close}
            rightContent={rightContent}
          />
        )}
        {children}
        {isValidElement(footer) || footer === null ? (
          footer
        ) : (
          <Box
            borderTopWidth={StyleSheet.hairlineWidth}
            borderTopColor="divider"
          >
            <HStack
              py="4"
              px="6"
              alignItems="center"
              space="3"
              justifyContent="flex-end"
            >
              {!hideSecondaryAction && (
                <Button
                  onPress={() => {
                    onSecondaryActionPress?.({ close });
                    onClose?.();
                  }}
                  {...secondaryActionProps}
                >
                  {secondaryActionProps?.children ??
                    intl.formatMessage({
                      id: secondaryActionTranslationId ?? 'action__cancel',
                    })}
                </Button>
              )}
              {!hidePrimaryAction && (
                <Button
                  type="primary"
                  onPress={() => {
                    onPrimaryActionPress?.({ onClose, close });
                  }}
                  {...primaryActionProps}
                >
                  {primaryActionProps?.children ??
                    intl.formatMessage({
                      id: primaryActionTranslationId ?? 'action__ok',
                    })}
                </Button>
              )}
            </HStack>
          </Box>
        )}
      </PresenceTransition>
    </Box>
  );
};

DesktopModal.displayName = 'DesktopModal';

export default DesktopModal;
