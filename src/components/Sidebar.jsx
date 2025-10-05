import React from 'react';
import { NavLink } from 'react-router-dom';
import { Box, VStack, Text, Flex, Icon } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiHome, 
  FiSettings, 
  FiPower, 
  FiCalendar, 
  FiPlus,
  FiGrid,
  FiAlertTriangle
} from 'react-icons/fi';

const Sidebar = ({ onClose }) => {
  const { logout } = useAuth();
  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const navItems = [
    { name: 'Dashboard', icon: FiHome, path: '/' },
    { name: 'Devices', icon: FiGrid, path: '/devices' },
    { name: 'Device Setup', icon: FiPlus, path: '/device-setup' },
    { name: 'Schedule', icon: FiCalendar, path: '/schedule' },
    { name: 'Alerts', icon: FiAlertTriangle, path: '/alerts' },
    { name: 'Settings', icon: FiSettings, path: '/settings' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      w={{ base: 'full', md: '240px' }}
      h="100vh"
      bg="blue.700"
      color="white"
      boxShadow="0 4px 12px 0 rgba(0, 0, 0, 0.05)"
      >
      <Flex h="20" alignItems="center" justifyContent="center" borderBottomWidth="1px" borderColor="blue.600">
        <Text fontSize="2xl" fontWeight="bold">MCD Streetlight</Text>
      </Flex>
      <VStack spacing={0} align="stretch" mt={4}>
        {navItems.map((item) => (
          <NavLink
            to={item.path}
            key={item.name}
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              borderLeft: isActive ? '4px solid white' : '4px solid transparent',
            })}
            onClick={handleLinkClick}
          >
            <Flex
              align="center"
              p="4"
              mx="4"
              borderRadius="lg"
              role="group"
              cursor="pointer"
              _hover={{
                bg: 'blue.600',
                color: 'white',
              }}
            >
              <Icon as={item.icon} mr="4" fontSize="16" />
              <Text>{item.name}</Text>
            </Flex>
          </NavLink>
        ))}
        <Flex
          align="center"
          p="4"
          mx="4"
          borderRadius="lg"
          role="group"
          cursor="pointer"
          onClick={() => { handleLogout(); if (onClose) onClose(); }}
          mt="auto"
          mb="4"
          _hover={{
            bg: 'blue.600',
            color: 'white',
          }}
        >
          <Icon as={FiPower} mr="4" fontSize="16" />
          <Text>Logout</Text>
        </Flex>
      </VStack>
    </Box>
  );
};

export default Sidebar;