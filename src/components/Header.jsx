import React from 'react';
import {
  Flex,
  Heading,
  Spacer,
  IconButton,
  HStack,
  Text,
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
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { currentUser } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleScroll = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
        <HStack spacing={4} display={{ base: 'none', md: 'flex' }} mr={4}>
          <IconButton
            aria-label="Features"
            icon={<Text>Features</Text>}
            variant="ghost"
            onClick={() => handleScroll('features')}
          />

          {!currentUser && (
            <>
              <IconButton
                aria-label="Login"
                icon={<Text>Login</Text>}
                variant="ghost"
                onClick={() => navigate('/login')}
              />
              <IconButton
                aria-label="Sign Up"
                icon={<Text>Sign Up</Text>}
                variant="ghost"
                onClick={() => navigate('/signup')}
              />
            </>
          )}
        </HStack>
        <IconButton
          aria-label="Toggle dark mode"
          icon={darkMode ? <FiSun /> : <FiMoon />}
          onClick={handleThemeToggle}
          variant="ghost"
          mr={2}
        />
        {currentUser && (
          <>
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
          </>
        )}
      </Flex>
    </Flex>
  );
};

export default Header;