import React, { useState, useEffect } from 'react';
import { 
  Box, 
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
  HStack,
  VStack,
  Select,
  Input // added
} from '@chakra-ui/react';
import { FiActivity, FiAlertTriangle, FiPower, FiCheckCircle, FiBatteryCharging, FiZap } from 'react-icons/fi';
import { database } from '../firebase/config';
import { ref, onValue, update, push } from 'firebase/database';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    defective: 0
  });
  
  // Device history state
  const [deviceHistory, setDeviceHistory] = useState({});
  const [historyFilter, setHistoryFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
   const [dateFilter, setDateFilter] = useState(''); // new state

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const historyItemBgColor = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const devicesRef = ref(database, 'devices');
    const historyRef = ref(database, 'deviceHistory');
    
    const deviceUnsubscribe = onValue(devicesRef, (snapshot) => {
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
    
    // Subscribe to device history
    const historyUnsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDeviceHistory(data);
      }
    });
    
    return () => {
      deviceUnsubscribe();
      historyUnsubscribe();
    };
  }, []);

  const getRecentDevices = () => {
    return devices
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))
      .slice(0, 4);
  };

  const toggleDeviceStatus = async (deviceId, currentStatus) => {
    const newStatus = currentStatus === 'on' ? 'off' : 'on';
    try {
      const ts = Date.now();
      await update(ref(database, `devices/${deviceId}`), {
        status: newStatus,
        lastUpdated: ts
      });
      // record history
      await push(ref(database, `deviceHistory/${deviceId}`), {
        status: newStatus,
        timestamp: ts,
        source: 'dashboard'
      });
    } catch (error) {
      console.error("Error toggling device status:", error);
    }
  };

  const toggleAllDevices = async () => {
    const allOn = devices.every(device => device.status === 'on');
    const updates = {};
    const ts = Date.now();
    devices.forEach(device => {
      const status = allOn ? 'off' : 'on';
      updates[`${device.id}/status`] = status;
      updates[`${device.id}/lastUpdated`] = ts;
    });
    try {
      await update(ref(database, 'devices'), updates);
      // push history entries for each device
      devices.forEach(device => {
        const status = allOn ? 'off' : 'on';
        push(ref(database, `deviceHistory/${device.id}`), {
          status,
          timestamp: ts,
          source: 'dashboard-bulk'
        });
      });
    } catch (error) {
      console.error('Error toggling all devices:', error);
    }
  };
  
  // Helper function to get all device history entries as a flat array
  const getAllDeviceHistory = () => {
    const allHistory = [];
    
    // Process each device's history
    Object.entries(deviceHistory).forEach(([deviceId, history]) => {
      if (history) {
        // Convert each history entry to an array item with device ID
        Object.entries(history).forEach(([entryId, entry]) => {
          allHistory.push({
            deviceId,
            entryId,
            entry
          });
        });
      }
    });
    
    // Sort by timestamp (newest first)
    return allHistory.sort((a, b) => b.entry.timestamp - a.entry.timestamp);
  };

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Flex justify="space-between" align="center" mb={4} flexDir={{ base: 'column', sm: 'row' }} gap={2}>
        <Box>
          <Heading mb={1} color="blue.600" fontSize={{ base: "xl", md: "2xl" }}>Dashboard</Heading>
          <Text color="gray.500" fontSize={{ base: "sm", md: "md" }}>MCD Street Light Control System Overview</Text>
        </Box>
        <Button
          colorScheme={devices.every(d => d.status === 'on') ? 'red' : 'green'}
          leftIcon={<Icon as={FiPower} />}
          onClick={toggleAllDevices}
          size={{ base: 'sm', md: 'md' }}
        >
          {devices.every(d => d.status === 'on') ? 'Turn All Off' : 'Turn All On'}
        </Button>
      </Flex>

      {/* Stats Overview */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 3, md: 5 }} mb={{ base: 5, md: 8 }}>
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
        <Heading size="md" mb={4} color="blue.600" fontSize={{ base: "lg", md: "xl" }}>Recent Devices</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 3, md: 5 }}>
          {getRecentDevices().map(device => {
            const isOnline = device.lastSeen && (new Date().getTime() - device.lastSeen < 300000);
            return (
              <Card key={device.id} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
                <CardHeader pb={0}>
                  <Flex justify="space-between" align="center">
                    <Heading size="sm" fontSize={{ base: "sm", md: "md" }}>{device.location || 'Unknown Location'}</Heading>
                    <Badge colorScheme={isOnline ? 'green' : 'red'} variant="subtle">
                      {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <Text fontSize={{ base: "xs", md: "sm" }} mb={2}>ID: {device.id}</Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} mb={2}>Power: {device.power || 'N/A'} W</Text>
                  <HStack mb={2}>
                    <Text fontSize={{ base: "xs", md: "sm" }}>Status:</Text>
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
      
      {/* Device History */}
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color="blue.600" fontSize={{ base: "lg", md: "xl" }}>Device Status History</Heading>
          <HStack spacing={2}>
            <Select 
              id="historyFilter" 
              size="sm" 
              width={{ base: "110px", md: "150px" }}
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="on">ON Only</option>
              <option value="off">OFF Only</option>
            </Select>
            <Select 
              id="deviceFilter" 
              size="sm" 
              width={{ base: "120px", md: "180px" }}
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
            >
              <option value="all">All Devices</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.location || device.id}
                </option>
              ))}
            </Select>
          </HStack>
        </Flex>
        <Input // new input for date filter
            type="date"
            size="sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
          <CardHeader pb={2}>
            <Heading size="sm" fontSize={{ base: "sm", md: "md" }}>Status Change Timeline</Heading>
          </CardHeader>
          <CardBody>
            {getAllDeviceHistory().length > 0 ? (
              <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto" pr={2}>
                {getAllDeviceHistory()
                  .filter(item => {
                    // Apply status filter
                    if (historyFilter !== 'all' && item.entry.status !== historyFilter) return false;
                    // Apply device filter
                    if (deviceFilter !== 'all' && item.deviceId !== deviceFilter) return false;
                    // Apply date filter
                    if (dateFilter) {
                      const start = new Date(dateFilter);
                      start.setHours(0,0,0,0);
                      const end = new Date(start);
                      end.setHours(23,59,59,999);
                      if (item.entry.timestamp < start.getTime() || item.entry.timestamp > end.getTime()) return false;
                    }
                    return true;
                  })
                  .map((item, index) => {
                    const device = devices.find(d => d.id === item.deviceId);
                    const deviceName = device ? (device.location || device.id) : item.deviceId;
                    const date = new Date(item.entry.timestamp);
                    
                    return (
                      <Flex 
                        key={index} 
                        p={3} 
                        bg={historyItemBgColor} 
                        borderRadius="md" 
                        borderLeft="4px solid" 
                        borderLeftColor={item.entry.status === 'on' ? 'green.400' : 'red.400'}
                        justify="space-between"
                        align="center"
                        flexWrap={{ base: "wrap", md: "nowrap" }}
                      >
                        <HStack spacing={2} mb={{ base: 2, md: 0 }} width={{ base: "100%", md: "auto" }}>
                          <Badge 
                            colorScheme={item.entry.status === 'on' ? 'green' : 'red'} 
                            fontSize={{ base: "xs", md: "sm" }}
                            px={2}
                            py={1}
                          >
                            {item.entry.status === 'on' ? 'ON' : 'OFF'}
                          </Badge>
                          <Text fontWeight="bold" fontSize={{ base: "xs", md: "sm" }}>
                            {deviceName}
                          </Text>
                        </HStack>
                        
                        <HStack spacing={3}>
                          <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
                            {date.toLocaleDateString()}
                          </Text>
                          <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="medium">
                            {date.toLocaleTimeString()}
                          </Text>
                          {item.entry.source && (
                            <Badge colorScheme="purple" size="sm">
                              {item.entry.source}
                            </Badge>
                          )}
                        </HStack>
                      </Flex>
                    );
                    })}
              </VStack>
            ) : (
              <Text fontSize={{ base: "sm", md: "md" }} color="gray.500" textAlign="center" py={4}>
                No history available
              </Text>
            )}
          </CardBody>
        </Card>
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