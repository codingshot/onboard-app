import {
  Badge,
  Box,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Show,
  Text,
  useDisclosure,
  Heading,
  Avatar,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  getDrops,
  getKeySupplyForDrop,
  getDropSupplyForOwner,
  deleteDrops,
  type ProtocolReturnedSimpleData,
  type ProtocolReturnedFTData,
  type ProtocolReturnedNFTData,
  type ProtocolReturnedFCData,
  type ProtocolReturnedMethod,
  getEnv,
} from 'keypom-js';
import { ChevronDownIcon } from '@chakra-ui/icons';

import { useAuthWalletContext } from '@/contexts/AuthWalletContext';
import { type ColumnItem, type DataItem } from '@/components/Table/types';
import { DataTable } from '@/components/Table';
import { DeleteIcon } from '@/components/Icons';
import { handleFinishNFTDrop } from '@/features/create-drop/contexts/CreateNftDropContext';
import { truncateAddress } from '@/utils/truncateAddress';
import { NextButton, PrevButton } from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import getConfig from '@/config/config';
import { asyncWithTimeout } from '@/utils/asyncWithTimeout';

import { MENU_ITEMS } from '../config/menuItems';

import { MobileDrawerMenu } from './MobileDrawerMenu';

const FETCH_NFT_METHOD_NAME = 'get_series_info';

const getDropTypeLabel = ({
  simple,
  ft,
  nft,
  fc,
}: {
  simple?: ProtocolReturnedSimpleData;
  ft?: ProtocolReturnedFTData;
  nft?: ProtocolReturnedNFTData;
  fc?: ProtocolReturnedFCData;
}) => {
  if (fc) {
    const { methods } = fc;
    if (methods.length === 1) {
      return 'NFT';
    }
    return 'Ticket';
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  } else if (simple || ft) return 'Token';
  else return 'Token';
};

const COLUMNS: ColumnItem[] = [
  {
    title: 'Drop name',
    selector: (drop) => drop.name,
    thProps: {
      minW: '240px',
    },
  },
  {
    title: '',
    selector: (drop) => drop.media,
  },
  {
    title: 'Drop type',
    selector: (drop) => drop.type,
  },
  {
    title: 'Claimed',
    selector: (drop) => drop.claimed,
  },
  {
    title: '',
    selector: (drop) => drop.action,
    tdProps: {
      display: 'flex',
      justifyContent: 'right',
    },
  },
];

export default function AllDrops() {
  const { viewCall } = getEnv();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [dataSize, setDataSize] = useState<number>(0);
  const [data, setData] = useState<DataItem[]>([
    {
      id: 0,
      name: 'test',
      type: 'hello',
      claimed: 'some',
    },
  ]);
  const [wallet, setWallet] = useState({});

  const {
    hasPagination,
    pagination,
    firstPage,
    lastPage,
    loading,
    handleNextPage,
    handlePrevPage,
  } = usePagination({
    dataSize,
    handlePrevApiCall: async () => {
      await handleGetDrops({
        start: (pagination.pageIndex - 1) * pagination.pageSize,
        limit: pagination.pageSize,
      });
    },
    handleNextApiCall: async () => {
      await handleGetDrops({
        start: (pagination.pageIndex + 1) * pagination.pageSize,
        limit: pagination.pageSize,
      });
    },
  });

  const { selector, accountId } = useAuthWalletContext();

  const handleGetDropsSize = async () => {
    const numDrops = await getDropSupplyForOwner({
      accountId,
    });

    setDataSize(numDrops);
  };

  const handleGetDrops = async ({ start = 0, limit = pagination.pageSize }) => {
    const drops = await getDrops({ accountId, start, limit });

    setWallet(await selector.wallet());

    setData(
      await Promise.all(
        drops.map(
          async ({
            drop_id: id,
            simple,
            ft,
            nft,
            fc,
            metadata = JSON.stringify({ dropName: 'untitled' }),
            next_key_id,
          }) => {
            const meta = JSON.parse(metadata);
            if (!meta.dropName) {
              meta.dropName = 'Untitled Drop';
            }

            const type = getDropTypeLabel({ simple, ft, nft, fc });

            let nftHref = '';
            if (type === 'NFT') {
              const fcMethod = (fc as ProtocolReturnedFCData).methods[0]?.[0];
              const { receiver_id } = fcMethod as ProtocolReturnedMethod;

              const nftData = await asyncWithTimeout(
                viewCall({
                  contractId: receiver_id,
                  methodName: FETCH_NFT_METHOD_NAME,
                  args: {
                    mint_id: parseInt(id),
                  },
                }),
              ).catch((_) => {
                console.error(); // eslint-disable-line no-console
              });

              nftHref =
                `${getConfig().cloudflareIfps}/${nftData?.metadata?.media as string}` ??
                'https://placekitten.com/200/300';
            }

            return {
              id,
              name: truncateAddress(meta.dropName, 'end', 48),
              type,
              media: type === 'NFT' ? nftHref : undefined,
              claimed: `${
                next_key_id - (await getKeySupplyForDrop({ dropId: id }))
              } / ${next_key_id}`,
            };
          },
        ),
      ),
    );
  };

  useEffect(() => {
    if (!accountId) return;
    handleGetDropsSize();
    handleGetDrops({});
    handleFinishNFTDrop();
  }, [accountId]);

  const dropMenuItems = MENU_ITEMS.map((item) => (
    <MenuItem key={item.label} {...item}>
      {item.label}
    </MenuItem>
  ));

  const handleDeleteClick = async (dropId) => {
    console.log('deleting drop', dropId);
    await deleteDrops({
      wallet,
      dropIds: [dropId],
    });
  };

  const getTableRows = (): DataItem[] => {
    if (data === undefined || data?.length === 0) return [];

    return data.map((drop) => ({
      ...drop,
      name: <Text color="gray.800">{drop.name}</Text>,
      type: (
        <Text fontWeight="normal" mt="0.5">
          {drop.type}
        </Text>
      ),
      media: drop.media !== undefined && <Avatar src={drop.media as string} />,
      claimed: <Badge variant="lightgreen">{drop.claimed} Claimed</Badge>,
      action: (
        <Button
          size="sm"
          variant="icon"
          onClick={async (e) => {
            e.stopPropagation();
            await handleDeleteClick(drop.id);
          }}
        >
          <DeleteIcon color="red" />
        </Button>
      ),
      href: `/drop/${(drop.type as string).toLowerCase()}/${drop.id}`,
    }));
  };

  return (
    <Box minH="100%" minW="100%">
      {/* Header Bar */}
      <HStack alignItems="center" display="flex" spacing="auto">
        <Heading>All drops</Heading>
        {/* Desktop Dropdown Menu */}
        <HStack>
          {hasPagination && (
            <PrevButton
              id="all-drops"
              isDisabled={!!firstPage}
              isLoading={loading.previous}
              onClick={handlePrevPage}
            />
          )}
          <Show above="sm">
            <Menu>
              {({ isOpen }) => (
                <Box>
                  <MenuButton
                    as={Button}
                    isActive={isOpen}
                    px="6"
                    py="3"
                    rightIcon={<ChevronDownIcon />}
                    variant="secondary"
                  >
                    Create a drop
                  </MenuButton>
                  <MenuList>{dropMenuItems}</MenuList>
                </Box>
              )}
            </Menu>
          </Show>

          {/* Mobile Menu Button */}
          <Show below="sm">
            <Button
              px="6"
              py="3"
              rightIcon={<ChevronDownIcon />}
              variant="secondary"
              onClick={onOpen}
            >
              Create a drop
            </Button>
          </Show>
          {hasPagination && (
            <NextButton
              id="all-drops"
              isDisabled={!!lastPage}
              isLoading={loading.next}
              onClick={handleNextPage}
            />
          )}
        </HStack>
      </HStack>

      <DataTable columns={COLUMNS} data={getTableRows()} mt={{ base: '6', md: '7' }} />

      {/* Mobile Menu For Creating Drop */}
      <Show below="sm">
        <MobileDrawerMenu isOpen={isOpen} onClose={onClose} />
      </Show>
    </Box>
  );
}
