import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Badge,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  Divider,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiSearch, FiPower, FiMapPin, FiClock, FiZap, FiBatteryCharging, FiAlertTriangle } from 'react-icons/fi';
import { database } from '../firebase/config';
import { ref, onValue, update } from 'firebase/database';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const devicesRef = ref(database, 'devices');
    
    try {
      const unsubscribe = onValue(devicesRef, (snapshot) => {
        setLoading(true);
        const data = snapshot.val();
        if (data) {
          const devicesList = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          
          setDevices(devicesList);
          setFilteredDevices(devicesList);
        } else {
          setDevices([]);
          setFilteredDevices([]);
        }
        setLoading(false);
      }, (error) => {
        setError(error.message);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let result = [...devices];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(device => 
        (device.name && device.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (device.location && device.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        device.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'online') {
        result = result.filter(device => 
          device.lastSeen && (new Date().getTime() - device.lastSeen < 300000)
        );
      } else if (statusFilter === 'offline') {
        result = result.filter(device => 
          !device.lastSeen || (new Date().getTime() - device.lastSeen >= 300000)
        );
      } else if (statusFilter === 'on') {
        result = result.filter(device => device.status === 'on');
      } else if (statusFilter === 'off') {
        result = result.filter(device => device.status === 'off');
      } else if (statusFilter === 'defective') {
        result = result.filter(device => {
          if (!device.totalBulbs || !device.wattPerDevice || !device.power) return false;
          const expectedPower = device.totalBulbs * device.wattPerDevice;
          const actualPower = device.power || 0;
          return device.status === 'on' && (expectedPower - actualPower) / device.wattPerDevice >= 1;
        });
      }
    }
    
    setFilteredDevices(result);
  }, [devices, searchQuery, statusFilter]);

  const toggleDeviceStatus = async (deviceId, currentStatus) => {
    const newStatus = currentStatus === 'on' ? 'off' : 'on';
    try {
      await update(ref(database, `devices/${deviceId}`), {
        status: newStatus,
        lastUpdated: new Date().getTime()
      });
    } catch (error) {
      console.error("Error toggling device status:", error);
      setError("Failed to update device status. Please try again.");
    }
  };

  const getDefectiveBulbCount = (device) => {
    const powerVal = Number(device.power);
    if (!device.totalBulbs || !device.wattPerDevice || isNaN(powerVal) || device.status !== 'on') return 0;
    const expectedPower = device.totalBulbs * device.wattPerDevice;
    const actualPower = powerVal;
    return Math.floor((expectedPower - actualPower) / device.wattPerDevice);
  };

  return (
    <Box p={4}>
      <Heading mb={2} color="blue.600">Devices</Heading>
      <Text color="gray.500" mb={6}>Manage and monitor all your street light devices</Text>
      
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {/* Filters */}
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        mb={6} 
        gap={4}
        align={{ base: 'stretch', md: 'center' }}
      >
        <InputGroup maxW={{ base: '100%', md: '300px' }}>
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="gray.400" />
          </InputLeftElement>
          <Input 
            placeholder="Search devices..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        
        <Select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          maxW={{ base: '100%', md: '200px' }}
        >
          <option value="all">All Devices</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="on">Status: ON</option>
          <option value="off">Status: OFF</option>
          <option value="defective">Defective</option>
        </Select>
        
        <Button 
          as={RouterLink} 
          to="/device-setup" 
          colorScheme="blue" 
          ml={{ base: 0, md: 'auto' }}
        >
          Add New Device
        </Button>
      </Flex>
      
      {/* Device List */}
      {loading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : filteredDevices.length === 0 ? (
        <Card p={6} textAlign="center" bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" boxShadow="md">
          <Text fontSize="lg">No devices found</Text>
          <Text color="gray.500" mt={2}>
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Add a new device to get started'}
          </Text>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredDevices.map(device => {
            const isOnline = device.lastSeen && (new Date().getTime() - device.lastSeen < 300000);
            const defectiveBulbs = getDefectiveBulbCount(device);
            
            return (
              <Card 
                key={device.id} 
                bg={bgColor} 
                borderWidth="1px" 
                borderColor={borderColor} 
                borderRadius="lg" 
                overflow="hidden"
                boxShadow="md"
                transition="transform 0.2s"
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
              >
                <CardHeader pb={0}>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">{device.name || `Device ${device.id.slice(0, 8)}`}</Heading>
                    <Badge colorScheme={isOnline ? 'green' : 'gray'} variant="subtle">
                      {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </Flex>
                </CardHeader>
                
                <CardBody>
                  <Flex align="center" mb={2}>
                    <Icon as={FiMapPin} mr={2} color="gray.500" />
                    <Text>{device.location || 'Unknown location'}</Text>
                  </Flex>
                  
                  <Flex align="center" mb={2}>
                    <Icon as={FiClock} mr={2} color="gray.500" />
                    <Text>Last seen: {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : 'Never'}</Text>
                  </Flex>
                  
                  <Divider my={3} />
                  
                  <SimpleGrid columns={2} spacing={3} mb={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Power</Text>
                      <Flex align="center">
                        <Icon as={FiZap} mr={1} color="orange.500" />
                        <Text fontWeight="medium">{isOnline ? `${isNaN(Number(device.power)) ? 0 : Number(device.power)} W` : 'N/A'}</Text>
                      </Flex>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.500">Energy</Text>
                      <Flex align="center">
                        <Icon as={FiBatteryCharging} mr={1} color="green.500" />
                        <Text fontWeight="medium">{isOnline ? `${device.energy || 0} kWh` : 'N/A'}</Text>
                      </Flex>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.500">Status</Text>
                      <Badge colorScheme={device.status === 'on' ? 'green' : 'gray'}>
                        {device.status === 'on' ? 'ON' : 'OFF'}
                      </Badge>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.500">Defective</Text>
                      {defectiveBulbs > 0 ? (
                        <Badge colorScheme="red">{defectiveBulbs} bulbs</Badge>
                      ) : (
                        <Badge colorScheme="green">None</Badge>
                      )}
                    </Box>
                  </SimpleGrid>
                  
                  {defectiveBulbs > 0 && (
                    <Flex align="center" mb={3} color="red.500">
                      <Icon as={FiAlertTriangle} mr={2} />
                      <Text fontSize="sm">Maintenance required</Text>
                    </Flex>
                  )}
                </CardBody>
                
                <CardFooter pt={0}>
                  <HStack spacing={4} width="100%">
                    <Button 
                      flex={1}
                      colorScheme={device.status === 'on' ? 'red' : 'green'}
                      leftIcon={<Icon as={FiPower} />}
                      isDisabled={!isOnline}
                      onClick={() => toggleDeviceStatus(device.id, device.status)}
                      size="sm"
                    >
                      {device.status === 'on' ? 'Turn Off' : 'Turn On'}
                    </Button>
                    
                    <Button 
                      flex={1}
                      colorScheme="blue"
                      as={RouterLink}
                      to={`/devices/${device.id}`}
                      size="sm"
                    >
                      Details
                    </Button>
                  </HStack>
                </CardFooter>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default Devices;