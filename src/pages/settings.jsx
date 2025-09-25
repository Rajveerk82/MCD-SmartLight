import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Switch,
  VStack,
  Flex,
  useToast,
  useColorModeValue,
  Divider,
  Alert,
  AlertIcon,
  Icon,
  Select,
  HStack,
  Avatar,
  AvatarBadge,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import {
  FiSave,
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiBell,
  FiSettings,
  FiShield,
  FiGlobe,
  FiMoon,
  FiSun,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { database } from '../firebase/config';
import { ref, onValue, set } from 'firebase/database';

const Settings = () => {
  const { currentUser, updateUserProfile, updateUserEmail, updateUserPassword } = useAuth();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Profile settings
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // App settings
  const [appSettings, setAppSettings] = useState({
    darkMode: false,
    notifications: {
      deviceOffline: true,
      defectiveBulbs: true,
      scheduledEvents: true,
      systemUpdates: true,
    },
    refreshInterval: '60',
    temperatureUnit: 'celsius',
    timeFormat: '24h',
  });
  const [isUpdatingAppSettings, setIsUpdatingAppSettings] = useState(false);

  useEffect(() => {
    // Load user data
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
    }

    // Load app settings from Firebase
    const settingsRef = ref(database, `settings/${currentUser?.uid}`);
    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAppSettings({
          ...appSettings,
          ...data,
        });
      }
    });
  }, [currentUser]);

  const handleAppSettingsChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., notifications.deviceOffline)
      const [parent, child] = name.split('.');
      setAppSettings({
        ...appSettings,
        [parent]: {
          ...appSettings[parent],
          [child]: type === 'checkbox' ? checked : value,
        },
      });
    } else {
      // Handle top-level properties
      setAppSettings({
        ...appSettings,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const saveAppSettings = async () => {
    if (!currentUser) return;
    
    setIsUpdatingAppSettings(true);
    try {
      const settingsRef = ref(database, `settings/${currentUser.uid}`);
      await set(settingsRef, appSettings);
      
      toast({
        title: 'Settings saved',
        description: 'Your application settings have been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to save settings: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingAppSettings(false);
    }
  };

  const updateProfile = async () => {
    setErrors({});
    
    if (!displayName.trim()) {
      setErrors(prev => ({ ...prev, displayName: 'Display name is required' }));
      return;
    }
    
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile({ displayName });
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update profile: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const updateEmail = async () => {
    setErrors({});
    
    if (!email.trim()) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }
    
    setIsUpdatingEmail(true);
    try {
      await updateUserEmail(email);
      
      toast({
        title: 'Email updated',
        description: 'Your email has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update email: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const updatePassword = async () => {
    setErrors({});
    
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return;
    }
    
    if (password.length < 6) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
      return;
    }
    
    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(password);
      
      toast({
        title: 'Password updated',
        description: 'Your password has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update password: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <Box p={4}>
      <Heading size="lg" color="blue.600" mb={6}>Settings</Heading>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Profile Settings */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
          <CardHeader pb={0}>
            <Flex align="center">
              <Icon as={FiUser} mr={2} />
              <Heading size="md">Profile Settings</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Flex direction={{ base: 'column', md: 'row' }} align={{ md: 'center' }} gap={4}>
                <Avatar size="xl" name={displayName || currentUser?.email}>
                  <AvatarBadge boxSize="1em" bg="green.500" />
                </Avatar>
                <Box flex="1">
                  <Text fontWeight="bold">{displayName || 'User'}</Text>
                  <Text color="gray.500">{currentUser?.email}</Text>
                  <Text fontSize="sm" color="gray.500">
                    Account created: {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                  </Text>
                </Box>
              </Flex>

              <Divider />

              <FormControl isInvalid={!!errors.displayName}>
                <FormLabel>Display Name</FormLabel>
                <InputGroup>
                  <Input
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </InputGroup>
                {errors.displayName && (
                  <FormErrorMessage>{errors.displayName}</FormErrorMessage>
                )}
              </FormControl>

              <Button
                leftIcon={<FiSave />}
                colorScheme="blue"
                isLoading={isUpdatingProfile}
                loadingText="Updating..."
                onClick={updateProfile}
              >
                Update Profile
              </Button>

              <Divider />

              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email Address</FormLabel>
                <InputGroup>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </InputGroup>
                {errors.email && (
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                )}
              </FormControl>

              <Button
                leftIcon={<FiMail />}
                colorScheme="blue"
                isLoading={isUpdatingEmail}
                loadingText="Updating..."
                onClick={updateEmail}
              >
                Update Email
              </Button>

              <Divider />

              <FormControl isInvalid={!!errors.password}>
                <FormLabel>New Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <InputRightElement>
                    <IconButton
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    />
                  </InputRightElement>
                </InputGroup>
                {errors.password && (
                  <FormErrorMessage>{errors.password}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel>Confirm New Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <InputRightElement>
                    <IconButton
                      icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    />
                  </InputRightElement>
                </InputGroup>
                {errors.confirmPassword && (
                  <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                )}
              </FormControl>

              <Button
                leftIcon={<FiLock />}
                colorScheme="blue"
                isLoading={isUpdatingPassword}
                loadingText="Updating..."
                onClick={updatePassword}
              >
                Update Password
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Application Settings */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
          <CardHeader pb={0}>
            <Flex align="center">
              <Icon as={FiSettings} mr={2} />
              <Heading size="md">Application Settings</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="darkMode" mb="0">
                  <Flex align="center">
                    <Icon as={appSettings.darkMode ? FiMoon : FiSun} mr={2} />
                    Dark Mode
                  </Flex>
                </FormLabel>
                <Switch
                  id="darkMode"
                  name="darkMode"
                  isChecked={appSettings.darkMode}
                  onChange={handleAppSettingsChange}
                  colorScheme="blue"
                />
              </FormControl>

              <Divider />

              <Box>
                <Flex align="center" mb={2}>
                  <Icon as={FiBell} mr={2} />
                  <Text fontWeight="medium">Notifications</Text>
                </Flex>
                <VStack spacing={3} pl={6}>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="deviceOffline" mb="0">
                      Device Offline Alerts
                    </FormLabel>
                    <Switch
                      id="deviceOffline"
                      name="notifications.deviceOffline"
                      isChecked={appSettings.notifications.deviceOffline}
                      onChange={handleAppSettingsChange}
                      colorScheme="blue"
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="defectiveBulbs" mb="0">
                      Defective Bulbs Alerts
                    </FormLabel>
                    <Switch
                      id="defectiveBulbs"
                      name="notifications.defectiveBulbs"
                      isChecked={appSettings.notifications.defectiveBulbs}
                      onChange={handleAppSettingsChange}
                      colorScheme="blue"
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="scheduledEvents" mb="0">
                      Scheduled Events
                    </FormLabel>
                    <Switch
                      id="scheduledEvents"
                      name="notifications.scheduledEvents"
                      isChecked={appSettings.notifications.scheduledEvents}
                      onChange={handleAppSettingsChange}
                      colorScheme="blue"
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="systemUpdates" mb="0">
                      System Updates
                    </FormLabel>
                    <Switch
                      id="systemUpdates"
                      name="notifications.systemUpdates"
                      isChecked={appSettings.notifications.systemUpdates}
                      onChange={handleAppSettingsChange}
                      colorScheme="blue"
                    />
                  </FormControl>
                </VStack>
              </Box>

              <Divider />

              <FormControl>
                <FormLabel>
                  <Flex align="center">
                    <Icon as={FiGlobe} mr={2} />
                    Data Refresh Interval
                  </Flex>
                </FormLabel>
                <Select
                  name="refreshInterval"
                  value={appSettings.refreshInterval}
                  onChange={handleAppSettingsChange}
                >
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Temperature Unit</FormLabel>
                <Select
                  name="temperatureUnit"
                  value={appSettings.temperatureUnit}
                  onChange={handleAppSettingsChange}
                >
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Time Format</FormLabel>
                <Select
                  name="timeFormat"
                  value={appSettings.timeFormat}
                  onChange={handleAppSettingsChange}
                >
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour</option>
                </Select>
              </FormControl>

              <Divider />

              <FormControl>
                <FormLabel>
                  <Flex align="center">
                    <Icon as={FiShield} mr={2} />
                    Security
                  </Flex>
                </FormLabel>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Two-Factor Authentication</Text>
                    <Text fontSize="sm">
                      Enhance your account security by enabling two-factor authentication.
                    </Text>
                  </Box>
                </Alert>
              </FormControl>

              <Button
                leftIcon={<FiSave />}
                colorScheme="blue"
                isLoading={isUpdatingAppSettings}
                loadingText="Saving..."
                onClick={saveAppSettings}
              >
                Save Settings
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default Settings;