import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Heading, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  SimpleGrid,
  Card, 
  CardHeader, 
  CardBody,
  Text,
  Flex,
  Badge,
  Icon,
  Button,
  useColorModeValue,
  Progress,
  Divider,
  HStack
} from '@chakra-ui/react';
import { FiActivity, FiAlertTriangle, FiPower, FiCheckCircle, FiBatteryCharging, FiZap } from 'react-icons/fi';
import { database } from '../firebase/config';
import { ref, onValue, update } from 'firebase/database';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    defective: 0
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const devicesRef = ref(database, 'devices');
    
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const devicesList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        setDevices(devicesList);
        
        // Calculate stats
        const online = devicesList.filter(device => 
          device.lastSeen && (new Date().getTime() - device.lastSeen < 300000)
        ).length;
        
        const defective = devicesList.filter(device => {
          if (!device.totalBulbs || !device.wattPerDevice || !device.power) return false;
          const expectedPower = device.totalBulbs * device.wattPerDevice;
          const actualPower = device.power || 0;
          return device.status === 'on' && (expectedPower - actualPower) / device.wattPerDevice >= 1;
        }).length;
        
        setStats({
          total: devicesList.length,
          online,
          offline: devicesList.length - online,
          defective
        });
      }
    });
    
    return () => unsubscribe();
  }, []);

  const getRecentDevices = () => {
    return devices
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))
      .slice(0, 4);
  };

  const toggleDeviceStatus = async (deviceId, currentStatus) => {
    const newStatus = currentStatus === 'on' ? 'off' : 'on';
    try {
      await update(ref(database, `devices/${deviceId}`), {
        status: newStatus,
        lastUpdated: new Date().getTime()
      });
    } catch (error) {
      console.error("Error toggling device status:", error);
    }
  };

  const toggleAllDevices = async () => {
    const allOn = devices.every(device => device.status === 'on');
    const updates = {};
    devices.forEach(device => {
      updates[`${device.id}/status`] = allOn ? 'off' : 'on';
      updates[`${device.id}/lastUpdated`] = new Date().getTime();
    });
    try {
      await update(ref(database, 'devices'), updates);
    } catch (error) {
      console.error('Error toggling all devices:', error);
    }
  };

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Heading mb={1} color="blue.600">Dashboard</Heading>
          <Text color="gray.500">MCD Street Light Control System Overview</Text>
        </Box>
        <Button
          colorScheme={devices.every(d => d.status === 'on') ? 'red' : 'green'}
          leftIcon={<Icon as={FiPower} />}
          onClick={toggleAllDevices}
        >
          {devices.every(d => d.status === 'on') ? 'Turn All Off' : 'Turn All On'}
        </Button>
      </Flex>

      {/* Stats Overview */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
        {/* TOTAL */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" fontWeight="medium">Total Devices</StatLabel>
              <StatNumber fontSize="3xl">{stats.total}</StatNumber>
              <StatHelpText>
                <Flex align="center">
                  <Icon as={FiActivity} mr={1} color="blue.500" />
                  <Text>All registered devices</Text>
                </Flex>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* ONLINE */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" fontWeight="medium">Online Devices</StatLabel>
              <StatNumber fontSize="3xl" color="green.500">{stats.online}</StatNumber>
              <StatHelpText>
                <Flex align="center">
                  <Icon as={FiCheckCircle} mr={1} color="green.500" />
                  <Text>Active and responding</Text>
                </Flex>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* OFFLINE */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" fontWeight="medium">Offline Devices</StatLabel>
              <StatNumber fontSize="3xl" color="gray.500">{stats.offline}</StatNumber>
              <StatHelpText>
                <Flex align="center">
                  <Icon as={FiPower} mr={1} color="gray.500" />
                  <Text>Not responding</Text>
                </Flex>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* DEFECTIVE */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm" fontWeight="medium">Defective Bulbs</StatLabel>
              <StatNumber fontSize="3xl" color="red.500">{stats.defective}</StatNumber>
              <StatHelpText>
                <Flex align="center">
                  <Icon as={FiAlertTriangle} mr={1} color="red.500" />
                  <Text>Require maintenance</Text>
                </Flex>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        

      </SimpleGrid>
      
      {/* Energy Overview */}
      <Box mb={8}>
        <Heading size="md" mb={4} color="blue.600">Energy Overview</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
          <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
            <CardHeader pb={0}>
              <Heading size="sm">Power Consumption</Heading>
            </CardHeader>
            <CardBody>
              <Flex align="center" mb={2}>
                <Icon as={FiZap} color="orange.500" mr={2} />
                <Text fontWeight="bold">
                  {devices.reduce((total, device) => total + (device.power || 0), 0).toFixed(2)} W
                </Text>
              </Flex>
              <Progress value={70} colorScheme="orange" size="sm" mb={2} />
              <Text fontSize="sm" color="gray.500">
                Current total power consumption across all devices
              </Text>
            </CardBody>
          </Card>
          
          <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
            <CardHeader pb={0}>
              <Heading size="sm">Energy Usage Today</Heading>
            </CardHeader>
            <CardBody>
              <Flex align="center" mb={2}>
                <Icon as={FiBatteryCharging} color="green.500" mr={2} />
                <Text fontWeight="bold">
                  {devices.reduce((total, device) => total + (device.energy || 0), 0).toFixed(2)} kWh
                </Text>
              </Flex>
              <Progress value={60} colorScheme="green" size="sm" mb={2} />
              <Text fontSize="sm" color="gray.500">
                Total energy consumed today
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>
      
      {/* Recent Devices */}
      <Box mb={8}>
        <Heading size="md" mb={4} color="blue.600">Recent Devices</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
          {getRecentDevices().map(device => {
            const isOnline = device.lastSeen && (new Date().getTime() - device.lastSeen < 300000);
            return (
              <Card key={device.id} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
                <CardHeader pb={0}>
                  <Flex justify="space-between" align="center">
                    <Heading size="sm">{device.location || 'Unknown Location'}</Heading>
                    <Badge colorScheme={isOnline ? 'green' : 'red'} variant="subtle">
                      {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <Text fontSize="sm" mb={2}>ID: {device.id}</Text>
                  <Text fontSize="sm" mb={2}>Power: {device.power || 'N/A'} W</Text>
                  <HStack mb={2}>
                    <Text fontSize="sm">Status:</Text>
                    <Badge colorScheme={device.status === 'on' ? 'green' : 'gray'}>
                      {device.status === 'on' ? 'ON' : 'OFF'}
                    </Badge>
                  </HStack>
                  <Divider my={2} />
                  <Button 
                    size="sm" 
                    colorScheme={device.status === 'on' ? 'red' : 'green'}
                    leftIcon={<Icon as={FiPower} />}
                    isDisabled={!isOnline}
                    onClick={() => toggleDeviceStatus(device.id, device.status)}
                    width="full"
                  >
                    {device.status === 'on' ? 'Turn Off' : 'Turn On'}
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>
      </Box>
      
      {/* Defective Devices */}
      <Box>
        <Heading size="md" mb={4} color="blue.600">Defective Devices</Heading>
        {devices.filter(device => {
          if (!device.totalBulbs || !device.wattPerDevice || !device.power) return false;
          const expectedPower = device.totalBulbs * device.wattPerDevice;
          const actualPower = device.power || 0;
          return device.status === 'on' && (expectedPower - actualPower) / device.wattPerDevice >= 1;
        }).length === 0 ? (
          <Card p={4} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" boxShadow="md">
            <Flex align="center" justify="center" direction="column" py={4}>
              <Icon as={FiCheckCircle} color="green.500" boxSize={10} mb={3} />
              <Text>No defective devices found.</Text>
            </Flex>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
            {devices.filter(device => {
              if (!device.totalBulbs || !device.wattPerDevice || !device.power) return false;
              const expectedPower = device.totalBulbs * device.wattPerDevice;
              const actualPower = device.power || 0;
              return device.status === 'on' && (expectedPower - actualPower) / device.wattPerDevice >= 1;
            }).map(device => {
              const defectiveBulbs = Math.floor((device.totalBulbs * device.wattPerDevice - device.power) / device.wattPerDevice);
              return (
                <Card key={device.id} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
                  <CardHeader pb={0}>
                    <Heading size="sm">{device.location || 'Unknown Location'}</Heading>
                  </CardHeader>
                  <CardBody>
                    <Text fontSize="sm" mb={2}>ID: {device.id}</Text>
                    <HStack mb={2}>
                      <Text fontSize="sm">Defective Bulbs:</Text>
                      <Badge colorScheme="red">
                        {defectiveBulbs}
                      </Badge>
                    </HStack>
                    <Progress 
                      value={(defectiveBulbs / device.totalBulbs) * 100} 
                      colorScheme="red" 
                      size="sm" 
                      mb={2} 
                    />
                    <Button 
                      size="sm" 
                      colorScheme="blue"
                      width="full"
                    >
                      View Details
                    </Button>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;