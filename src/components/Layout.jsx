import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

const Layout = ({ children }) => {
  return (
    <Flex h="100vh">
      <Sidebar />
      <Box flex="1" overflow="auto">
        <DashboardHeader />
        <Box as="main" p={4}>
          {children || <Outlet />}
        </Box>
      </Box>
    </Flex>
  );
};

export default Layout;