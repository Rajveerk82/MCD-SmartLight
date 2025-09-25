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
  MenuItem
} from '@chakra-ui/react';
import { FiMoon, FiSun, FiBell } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { currentUser } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  // Toggle both Chakra UI color mode and custom theme context
  const handleThemeToggle = () => {
    toggleTheme();
    toggleColorMode();
  };

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      w="100%"
      px={4}
      py={2}
      borderBottomWidth="1px"
      borderColor="gray.200"
      bg={colorMode === 'light' ? 'white' : 'gray.800'}
      boxShadow="sm"
    >
      <Heading size="md">MCD Street Light Control System</Heading>
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
        />
        <Menu>
          <MenuButton>
            <Avatar size="sm" name={currentUser?.displayName || 'User'} />
          </MenuButton>
          <MenuList>
            <MenuItem>Profile</MenuItem>
            <MenuItem>Settings</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
};

export default Header;