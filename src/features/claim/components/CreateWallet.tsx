import { Text, VStack } from '@chakra-ui/react';

import { WALLET_OPTIONS } from '@/constants/common';

import { WalletOption } from './WalletOption';

interface CreateWalletProps {
  onClick: () => void;
}

export const CreateWallet = ({ onClick }: CreateWalletProps) => {
  return (
    <>
      <Text color="gray.800" fontWeight="500" size={{ base: 'md', md: 'lg' }}>
        Create a wallet to store your assets
      </Text>
      <VStack spacing="1" w="full">
        {WALLET_OPTIONS.map((options, index) => (
          <WalletOption key={index} {...options} />
        ))}
      </VStack>
      <Text
        _hover={{
          cursor: 'pointer',
          color: 'gray.500',
        }}
        textDecor="underline"
        onClick={onClick}
      >
        I already have a wallet
      </Text>
    </>
  );
};
