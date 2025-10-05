import React from 'react';
import {
  Flex,
  Heading,
  Spacer,
  IconButton,
  useColorMode,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { FiMoon, FiSun, FiBell } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardHeader = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const darkMode = colorMode === 'dark';

  const handleThemeToggle = () => {
    toggleColorMode();
  };

  return (
    <Flex
      as="header"
      position="sticky"
      top="0"
      zIndex="docked"
      align="center"
      justify="space-between"
      w="100%"
      px={4}
      pl={{ base: 12, md: 4 }}
      py={2}
      borderBottomWidth="1px"
      borderColor="gray.200"
      bg={colorMode === 'light' ? 'white' : 'gray.800'}
      boxShadow="sm"
    >
      <Heading size="md">MCD Dashboard</Heading>
      <Spacer />
      <Flex align="center">
        <IconButton
          aria-label="Toggle dark mode"
          icon={darkMode ? <FiSun /> : <FiMoon />}
          onClick={handleThemeToggle}
          variant="ghost"
          mr={2}
        />
        <IconButton
          aria-label="Notifications"
          icon={<FiBell />}
          variant="ghost"
          mr={4}
          onClick={() => navigate('/alerts')}
        />
        <Menu>
          <MenuButton>
            <Avatar size="sm" name={currentUser?.displayName || 'User'} />
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => navigate('/settings')}>Settings</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
};

export default DashboardHeader;