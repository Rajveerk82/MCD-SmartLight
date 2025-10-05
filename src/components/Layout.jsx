import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Flex, useDisclosure, Drawer, DrawerContent, IconButton } from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Flex h="100vh">
      {/* Mobile nav trigger */}
      <IconButton
        aria-label="Open Menu"
        icon={<FiMenu />}
        variant="ghost"
        bg="transparent"
        _hover={{ bg: 'gray.200' }}
        _active={{ bg: 'gray.300' }}
        _focus={{ boxShadow: 'none', bg: 'transparent' }}
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        top={2}
        left={2}
        zIndex="overlay"
        onClick={onOpen}
      />
      {/* Sidebar for desktop */}
      <Box display={{ base: 'none', md: 'block' }}>
        <Sidebar />
      </Box>
      {/* Drawer for mobile */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen} size="xs">
        <DrawerContent>
          <Sidebar onClose={onClose} />
        </DrawerContent>
      </Drawer>
      <Box flex="1" overflow="auto">
        <DashboardHeader />
        <Box as="main" p={4} pt={{ base: 12, md: 4 }}>
          {children || <Outlet />}
        </Box>
      </Box>
    </Flex>
  );
};

export default Layout;