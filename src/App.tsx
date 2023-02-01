import React from 'react';
import { RouterProvider } from 'react-router-dom';

import { Fonts } from '@/components/Fonts';
import { Loading } from '@/components/Loading';
import { theme } from '@/theme';
import { router } from '@/router';

const ChakraProvider = React.lazy(
  async () =>
    await import('@chakra-ui/react').then((mod) => {
      return { default: mod.ChakraProvider };
    }),
);

export const App = () => {
  return (
    <React.Suspense fallback={<Loading />}>
      <ChakraProvider theme={theme}>
        <Fonts />
        <RouterProvider router={router} />
      </ChakraProvider>
    </React.Suspense>
  );
};
