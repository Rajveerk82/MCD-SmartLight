import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Text,
  Flex,
  Badge,
  Button,
  Icon,
  useColorModeValue,
  IconButton
} from '@chakra-ui/react';
import { FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import { database } from '../firebase/config';
import { ref, onValue } from 'firebase/database';

const DefectiveDevices = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  
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
        
        // Filter devices with defective bulbs
        const defectiveDevices = devicesList.filter(device => {
          if (!device.totalBulbs || !device.wattPerDevice || !device.power) return false;
          const expectedPower = device.totalBulbs * device.wattPerDevice;
          const actualPower = device.power || 0;
          return device.status === 'on' && (expectedPower - actualPower) / device.wattPerDevice >= 1;
        });
        
        setDevices(defectiveDevices);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const calculateDefectiveBulbs = (device) => {
    if (!device || !device.totalBulbs || !device.wattPerDevice || device.status !== 'on') return 0;
    
    const expectedPower = device.totalBulbs * device.wattPerDevice;
    const actualPower = device.power || 0;
    const defectiveBulbs = Math.max(0, Math.floor((expectedPower - actualPower) / device.wattPerDevice));
    
    return defectiveBulbs;
  };

  return (
    <Box p={4}>
      <Flex mb={6} align="center">
        <IconButton
          icon={<FiArrowLeft />}
          aria-label="Go back"
          mr={4}
          onClick={() => navigate('/')}
        />
        <Heading flex="1">Defective Devices</Heading>
      </Flex>
      
      {devices.length === 0 ? (
        <Text>No defective devices found.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
          {devices.map(device => (
            <Card key={device.id} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
              <CardHeader pb={0}>
                <Flex justify="space-between" align="center">
                  <Heading size="sm">{device.location || 'Unknown Location'}</Heading>
                  <Badge colorScheme="red">
                    <Flex align="center">
                      <Icon as={FiAlertTriangle} mr={1} />
                      {calculateDefectiveBulbs(device)} Defective
                    </Flex>
                  </Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                <Text fontSize="sm" mb={2}>ID: {device.id}</Text>
                <Text fontSize="sm" mb={2}>Total Bulbs: {device.totalBulbs}</Text>
                <Text fontSize="sm" mb={2}>Expected Power: {device.totalBulbs * device.wattPerDevice}W</Text>
                <Text fontSize="sm" mb={2}>Actual Power: {device.power || 0}W</Text>
                <Text fontSize="sm" mb={4}>Status: {device.status === 'on' ? 'ON' : 'OFF'}</Text>
                <Button size="sm" colorScheme="blue" width="full" onClick={() => navigate(`/devices/${device.id}`)}>
                  View Details
                </Button>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default DefectiveDevices;