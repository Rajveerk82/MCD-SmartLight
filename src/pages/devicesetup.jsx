import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  FormErrorMessage,
  Heading,
  Text,
  VStack,
  HStack,
  useToast,
  Card,
  CardBody,
  Divider,
  Icon,
  InputGroup,
  InputLeftElement,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiSave, FiMapPin, FiZap, FiLayers, FiInfo, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { database } from '../firebase/config';
import { ref, set, get, update } from 'firebase/database';

const DeviceSetup = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [isNewDevice, setIsNewDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form fields
  const [deviceData, setDeviceData] = useState({
    deviceId: '',
    name: '',
    location: '',
    totalBulbs: '',
    wattPerDevice: '',
  });

  useEffect(() => {
    // If deviceId is provided in URL, we're editing an existing device
    if (deviceId) {
      setIsNewDevice(false);
      setIsLoading(true);
      setDeviceData(prev => ({ ...prev, deviceId }));
      
      // Fetch existing device data
      const deviceRef = ref(database, `devices/${deviceId}`);
      get(deviceRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setDeviceData({
              deviceId,
              name: data.name || '',
              location: data.location || '',
              totalBulbs: data.totalBulbs || '',
              wattPerDevice: data.wattPerDevice || '',
            });
          } else {
            toast({
              title: 'Device not found',
              description: 'The requested device could not be found.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            navigate('/devices');
          }
        })
        .catch((error) => {
          toast({
            title: 'Error',
            description: `Failed to load device data: ${error.message}`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [deviceId, navigate, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeviceData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleNumberInputChange = (name, value) => {
    setDeviceData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!deviceData.deviceId.trim()) {
      errors.deviceId = 'Device ID is required';
    }
    
    if (!deviceData.name.trim()) {
      errors.name = 'Device name is required';
    }
    
    if (!deviceData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    if (!deviceData.totalBulbs) {
      errors.totalBulbs = 'Total bulbs is required';
    } else if (isNaN(deviceData.totalBulbs) || Number(deviceData.totalBulbs) <= 0) {
      errors.totalBulbs = 'Total bulbs must be a positive number';
    }
    
    if (!deviceData.wattPerDevice) {
      errors.wattPerDevice = 'Watt per device is required';
    } else if (isNaN(deviceData.wattPerDevice) || Number(deviceData.wattPerDevice) <= 0) {
      errors.wattPerDevice = 'Watt per device must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const deviceRef = ref(database, `devices/${deviceData.deviceId}`);
      
      // Check if device exists (for new devices)
      if (isNewDevice) {
        const snapshot = await get(deviceRef);
        if (snapshot.exists()) {
          setFormErrors(prev => ({ 
            ...prev, 
            deviceId: 'Device ID already exists. Please use a different ID.' 
          }));
          setIsSaving(false);
          return;
        }
      }
      
      // Prepare data to save
      const dataToSave = {
        name: deviceData.name,
        location: deviceData.location,
        totalBulbs: Number(deviceData.totalBulbs),
        wattPerDevice: Number(deviceData.wattPerDevice),
        lastUpdated: new Date().getTime(),
      };
      
      // For new devices, add default values
      if (isNewDevice) {
        dataToSave.status = 'off';
        dataToSave.voltage = 0;
        dataToSave.current = 0;
        dataToSave.power = 0;
        dataToSave.energy = 0;
      }
      
      // Save to Firebase
      if (isNewDevice) {
        await set(deviceRef, dataToSave);
      } else {
        await update(deviceRef, dataToSave);
      }
      
      toast({
        title: isNewDevice ? 'Device Created' : 'Device Updated',
        description: isNewDevice 
          ? `Device ${deviceData.name} has been successfully created.` 
          : `Device ${deviceData.name} has been successfully updated.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Navigate back to devices list
      navigate('/devices');
      
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isNewDevice ? 'create' : 'update'} device: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box p={4}>
      <Flex mb={6} align="center">
        <Button 
          leftIcon={<FiArrowLeft />} 
          variant="outline" 
          onClick={() => navigate('/devices')}
          mr={4}
        >
          Back
        </Button>
        <Heading size="lg" color="blue.600">
          {isNewDevice ? 'Add New Device' : 'Edit Device'}
        </Heading>
      </Flex>

      <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md" mb={6}>
        <CardBody>
          <Alert status="info" mb={6} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Device Configuration</AlertTitle>
              <AlertDescription>
                Configure the device parameters to calculate defective bulbs and monitor performance.
              </AlertDescription>
            </Box>
          </Alert>

          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <FormControl isRequired isInvalid={!!formErrors.deviceId} isDisabled={!isNewDevice}>
                <FormLabel>Device ID</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiInfo} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    name="deviceId"
                    value={deviceData.deviceId}
                    onChange={handleInputChange}
                    placeholder="Enter unique device identifier"
                  />
                </InputGroup>
                {formErrors.deviceId && (
                  <FormErrorMessage>{formErrors.deviceId}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!formErrors.name}>
                <FormLabel>Device Name</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiInfo} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    name="name"
                    value={deviceData.name}
                    onChange={handleInputChange}
                    placeholder="Enter device name"
                  />
                </InputGroup>
                {formErrors.name && (
                  <FormErrorMessage>{formErrors.name}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!formErrors.location}>
                <FormLabel>Location</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiMapPin} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    name="location"
                    value={deviceData.location}
                    onChange={handleInputChange}
                    placeholder="Enter device location"
                  />
                </InputGroup>
                {formErrors.location && (
                  <FormErrorMessage>{formErrors.location}</FormErrorMessage>
                )}
              </FormControl>

              <Divider />

              <Text fontWeight="bold" color="blue.600">
                <Icon as={FiZap} mr={2} />
                Power Configuration
              </Text>

              <HStack spacing={6}>
                <FormControl isRequired isInvalid={!!formErrors.totalBulbs}>
                  <FormLabel>Total Bulbs</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiLayers} color="gray.500" />
                    </InputLeftElement>
                    <NumberInput
                      min={1}
                      value={deviceData.totalBulbs}
                      onChange={(value) => handleNumberInputChange('totalBulbs', value)}
                    >
                      <NumberInputField
                        name="totalBulbs"
                        placeholder="Enter total number of bulbs"
                      />
                    </NumberInput>
                  </InputGroup>
                  {formErrors.totalBulbs && (
                    <FormErrorMessage>{formErrors.totalBulbs}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isRequired isInvalid={!!formErrors.wattPerDevice}>
                  <FormLabel>Watt Per Bulb</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiZap} color="gray.500" />
                    </InputLeftElement>
                    <NumberInput
                      min={1}
                      value={deviceData.wattPerDevice}
                      onChange={(value) => handleNumberInputChange('wattPerDevice', value)}
                    >
                      <NumberInputField
                        name="wattPerDevice"
                        placeholder="Enter watts per bulb"
                      />
                    </NumberInput>
                  </InputGroup>
                  {formErrors.wattPerDevice && (
                    <FormErrorMessage>{formErrors.wattPerDevice}</FormErrorMessage>
                  )}
                </FormControl>
              </HStack>

              <Box mt={4}>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  <Icon as={FiInfo} mr={1} />
                  Defective bulbs will be calculated using the formula:
                </Text>
                <Alert status="info" variant="subtle" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Defective Bulbs = (Total Bulbs × Watt Per Bulb - Actual Power) ÷ Watt Per Bulb
                  </Text>
                </Alert>
              </Box>

              <Divider />

              <Flex justify="flex-end">
                <Button
                  leftIcon={<FiArrowLeft />}
                  mr={3}
                  onClick={() => navigate('/devices')}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  leftIcon={isNewDevice ? <FiCheck /> : <FiSave />}
                  isLoading={isSaving}
                  loadingText={isNewDevice ? "Creating..." : "Updating..."}
                >
                  {isNewDevice ? 'Create Device' : 'Update Device'}
                </Button>
              </Flex>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Box>
  );
};

export default DeviceSetup;