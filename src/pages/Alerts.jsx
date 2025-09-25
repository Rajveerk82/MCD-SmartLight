import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Flex,
  Icon
} from '@chakra-ui/react';
import { FiAlertTriangle, FiPower } from 'react-icons/fi';
import { database } from '../firebase/config';
import { ref, onValue } from 'firebase/database';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const devicesRef = ref(database, 'devices');
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setAlerts([]);
        return;
      }
      const list = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      // Threshold in ms to consider device offline (3 * 5s publish interval = 15s, extend for safety)
      const OFFLINE_THRESHOLD = 20000;

      const defectiveAlerts = list.filter((d) => {
        if (!d.totalBulbs || !d.wattPerDevice || !d.power) return false;
        const expected = d.totalBulbs * d.wattPerDevice;
        const defective = d.status === 'on' && (expected - (d.power || 0)) / d.wattPerDevice >= 1;
        return defective;
      }).map((d) => ({ type: 'defective', device: d }));

      const errorAlerts = list.filter((d) => d.error).map((d) => ({ type: 'error', device: d, message: d.error }));

      const offlineAlerts = list.filter((d) => {
        if (!d.lastSeen) return true; // never seen before
        return new Date().getTime() - d.lastSeen > OFFLINE_THRESHOLD;
      }).map((d) => ({ type: 'offline', device: d }));

      setAlerts([...defectiveAlerts, ...errorAlerts, ...offlineAlerts]);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Box p={4}>
      <Heading mb={4} color="blue.600">Alerts</Heading>
      {alerts.length === 0 ? (
        <Text>No alerts at the moment 🎉</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
          {alerts.map((alert, idx) => (
            <Card as={RouterLink} to={`/devices/${alert.device.id}`} key={idx} _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }} borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="md">
              <CardHeader pb={0}>
                <Flex align="center">
                  <Icon 
                    as={
                      alert.type === 'defective' ? FiAlertTriangle : alert.type === 'error' ? FiPower : FiAlertTriangle
                    } 
                    mr={2} 
                    color={
                      alert.type === 'defective' ? 'orange.500' : alert.type === 'error' ? 'red.500' : 'yellow.500'
                    } 
                  />
                  <Heading size="sm">
                    {alert.type === 'defective' ? 'Defective Bulbs Detected' : alert.type === 'error' ? 'Device Error' : 'Device Offline'}
                  </Heading>
                </Flex>
              </CardHeader>
              <CardBody>
                <Text mb={2}>Device ID: <Badge colorScheme="blue">{alert.device.id}</Badge></Text>
                {alert.type === 'defective' ? (
                  <Text>{alert.device.location || 'Unknown location'} has defective bulbs needing maintenance.</Text>
                ) : alert.type === 'error' ? (
                  <Text>{alert.message}</Text>
                ) : (
                  <Text>Device has not reported data recently and appears offline.</Text>
                )}
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default Alerts;