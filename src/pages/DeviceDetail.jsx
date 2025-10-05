import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Badge,
  Button,
  Flex,
  Text,
  IconButton,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  useDisclosure,
  VStack
} from '@chakra-ui/react';
import { FiArrowLeft, FiPower, FiAlertTriangle, FiEdit } from 'react-icons/fi';
import { database } from '../firebase/config';
import { ref, onValue, update, get, push } from 'firebase/database';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to format timestamps
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString();
};

// Helper to sanitize numeric readings
const sanitizeNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const DeviceDetail = () => {
  const { id: deviceId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editLocation, setEditLocation] = useState('');
  const [editTotalBulbs, setEditTotalBulbs] = useState('');
  const [editWattPerDevice, setEditWattPerDevice] = useState('');
  
  // Function to handle device info updates
  const handleUpdateDeviceInfo = async () => {
    try {
      const deviceRef = ref(database, `devices/${deviceId}`);
      await update(deviceRef, {
        location: editLocation,
        totalBulbs: parseInt(editTotalBulbs),
        wattPerDevice: parseInt(editWattPerDevice)
      });
      
      toast({
        title: "Device updated",
        description: "Device information has been updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error updating device",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingCommand, setProcessingCommand] = useState(false);
  const [historicalData, setHistoricalData] = useState({
    voltage: [],
    current: [],
    power: [],
    timestamps: []
  });

  useEffect(() => {
    const deviceRef = ref(database, `devices/${deviceId}`);
    const historyRef = ref(database, `history/${deviceId}`);
    
    // Get current device data
    const deviceUnsubscribe = onValue(deviceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // inside device fetch success
            setDevice({
              id: deviceId,
              ...data
            });
            // prefill edit states
            setEditLocation(data.location || '');
            setEditTotalBulbs(data.totalBulbs || '');
            setEditWattPerDevice(data.wattPerDevice || '');
      } else {
        toast({
          title: 'Error',
          description: 'Device not found',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/devices');
      }
      setLoading(false);
    });
    
    // Get historical data
    const historyUnsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Process historical data for charts
        const timestamps = [];
        const voltageData = [];
        const currentData = [];
        const powerData = [];
        
        // Sort by timestamp
        const sortedEntries = Object.entries(data)
          .sort(([keyA, valA], [keyB, valB]) => Number(keyA) - Number(keyB))
          .slice(-24); // Last 24 entries
        
        sortedEntries.forEach(([timestamp, reading]) => {
          const date = new Date(Number(timestamp));
          timestamps.push(`${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`);
          voltageData.push(reading.voltage || 0);
          currentData.push(reading.current || 0);
          powerData.push(reading.power || 0);
        });
        
        setHistoricalData({
          timestamps,
          voltage: voltageData,
          current: currentData,
          power: powerData
        });
      }
    });
    
    return () => {
      deviceUnsubscribe();
      historyUnsubscribe();
    };
  }, [deviceId, navigate, toast]);

  const handleToggleDevice = async () => {
    if (!device) return;
    
    setProcessingCommand(true);
    const newStatus = device.status === 'on' ? 'off' : 'on';
    
    try {
      const deviceRef = ref(database, `devices/${deviceId}`);
      await update(deviceRef, { 
        status: newStatus,
        command: newStatus,
        lastUpdated: new Date().getTime()
      });
      const ts = Date.now();
      await update(deviceRef, { 
        status: newStatus,
        command: newStatus,
        lastUpdated: ts
      });
      await push(ref(database, `deviceHistory/${deviceId}`), {
        status: newStatus,
        timestamp: ts,
        source: 'user'
      });
      
      toast({
        title: 'Success',
        description: `Device turned ${newStatus.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to toggle device: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setProcessingCommand(false);
    }
  };

  const isDeviceOnline = () => {
    return device && device.lastSeen && (new Date().getTime() - device.lastSeen < 300000);
  };

  const calculateDefectiveBulbs = () => {
    if (!device || !device.totalBulbs || !device.wattPerDevice || device.status !== 'on') return 0;
    const expectedPower = device.totalBulbs * device.wattPerDevice;
    const actualPower = isNaN(Number(device.power)) ? 0 : Number(device.power);
    const defectiveBulbs = Math.max(0, Math.floor((expectedPower - actualPower) / device.wattPerDevice));
    return defectiveBulbs;
  };

  const voltageChartData = {
    labels: historicalData.timestamps,
    datasets: [
      {
        label: 'Voltage (V)',
        data: historicalData.voltage,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4
      }
    ]
  };

  const currentChartData = {
    labels: historicalData.timestamps,
    datasets: [
      {
        label: 'Current (A)',
        data: historicalData.current,
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.4
      }
    ]
  };

  const powerChartData = {
    labels: historicalData.timestamps,
    datasets: [
      {
        label: 'Power (W)',
        data: historicalData.power,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      }
    ]
  };

  // Combined chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Value'
        }
      }
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="500px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!device) {
    return (
      <Alert status="error">
        <AlertIcon />
        Device not found
      </Alert>
    );
  }

  return (
    <>
      <Flex mb={5} alignItems="center">
        <IconButton
          icon={<FiArrowLeft />}
          mr={3}
          onClick={() => navigate('/devices')}
          aria-label="Back to devices"
        />
        <Heading size="lg">{device.name || 'Device Details'}</Heading>
        <Text ml={4} fontWeight="bold">({device.id})</Text>
        <Badge ml={2} colorScheme={isDeviceOnline() ? 'green' : 'red'}>
          {isDeviceOnline() ? 'Online' : 'Offline'}
        </Badge>
      </Flex>
      <Flex justifyContent="space-between" alignItems="center" mb={5}>
        <Text>
          Location: {device.location || 'Not specified'}{' '}
          <IconButton
            size="sm"
            ml={2}
            icon={<FiEdit />}
            onClick={() => {
              setEditLocation(device.location || '');
              setEditTotalBulbs(device.totalBulbs || '');
              setEditWattPerDevice(device.wattPerDevice || '');
              onOpen();
            }}
            aria-label="Edit device info"
          />
          <Badge ml={4} colorScheme={device.status === 'on' ? 'green' : 'gray'}>
            {device.status === 'on' ? 'ON' : 'OFF'}
          </Badge>
        </Text>
        <Button
          colorScheme={device.status === 'on' ? 'red' : 'green'}
          leftIcon={<FiPower />}
          isLoading={processingCommand}
          onClick={handleToggleDevice}
        >
          {device.status === 'on' ? 'Turn Off' : 'Turn On'}
        </Button>
      </Flex>

      {/* Device Info */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={5} mb={8}>
        <Card>
             <CardBody>
               <Stat>
                 <StatLabel>Power Consumption</StatLabel>
                 <StatNumber>{isDeviceOnline() ? sanitizeNumber(device.power) : 0} W</StatNumber>
                 <StatHelpText>Current power usage</StatHelpText>
               </Stat>
             </CardBody>
           </Card>
           {/* Voltage */}
           <Card>
             <CardBody>
               <Stat>
                 <StatLabel>Voltage</StatLabel>
                 <StatNumber>{isDeviceOnline() ? sanitizeNumber(device.voltage) : 0} V</StatNumber>
                 <StatHelpText>Current voltage</StatHelpText>
               </Stat>
             </CardBody>
           </Card>
           {/* Current */}
           <Card>
             <CardBody>
               <Stat>
                 <StatLabel>Current</StatLabel>
                 <StatNumber>{isDeviceOnline() ? sanitizeNumber(device.current) : 0} A</StatNumber>
                 <StatHelpText>Current draw</StatHelpText>
               </Stat>
             </CardBody>
            </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Defective Bulbs</StatLabel>
              <StatNumber>
                {calculateDefectiveBulbs()}
                <Badge ml={2} colorScheme={calculateDefectiveBulbs() > 0 ? 'red' : 'green'}>
                  {calculateDefectiveBulbs() > 0 ? <FiAlertTriangle /> : ''}
                </Badge>
              </StatNumber>
              <StatHelpText>Out of {device.totalBulbs || 0} total bulbs</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Combined Chart Section */}
      <Heading size="md" mb={4}>Historical Data</Heading>
      <Card mb={8}>
        <CardBody>
          {historicalData.timestamps.length > 0 ? (
            <Box h={{ base: "250px", md: "300px" }}>
              <Line 
                options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: {
                        display: true,
                        text: 'Voltage (V) / Current (A)'
                      }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      title: {
                        display: true,
                        text: 'Power (W)'
                      },
                      grid: {
                        drawOnChartArea: false
                      }
                    }
                  }
                }}
                data={{
                  labels: historicalData.timestamps,
                  datasets: [
                    {
                      label: 'Voltage (V)',
                      data: historicalData.voltage,
                      borderColor: 'rgba(54, 162, 235, 1)',
                      backgroundColor: 'rgba(54, 162, 235, 0.2)',
                      tension: 0.4,
                      yAxisID: 'y'
                    },
                    {
                      label: 'Current (A)',
                      data: historicalData.current,
                      borderColor: 'rgba(255, 159, 64, 1)',
                      backgroundColor: 'rgba(255, 159, 64, 0.2)',
                      tension: 0.4,
                      yAxisID: 'y'
                    },
                    {
                      label: 'Power (W)',
                      data: historicalData.power,
                      borderColor: 'rgba(75, 192, 192, 1)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      tension: 0.4,
                      yAxisID: 'y1'
                    }
                  ]
                }}
              />
            </Box>
          ) : (
            <Text textAlign="center" py={10}>No historical data available</Text>
          )}
        </CardBody>
      </Card>

      {/* Energy Consumption removed as per requirement */}
      

      {/* Edit Device Info Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Device Information</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl id="location">
                <FormLabel>Location</FormLabel>
                <Input value={editLocation} onChange={(e)=>setEditLocation(e.target.value)} />
              </FormControl>
              <FormControl id="totalBulbs">
                <FormLabel>Total Bulbs</FormLabel>
                <NumberInput value={editTotalBulbs} min={0} onChange={(v)=>setEditTotalBulbs(v)}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl id="wattPerDevice">
                <FormLabel>Watts per Bulb</FormLabel>
                <NumberInput value={editWattPerDevice} min={0} onChange={(v)=>setEditWattPerDevice(v)}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateDeviceInfo} isLoading={processingCommand}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default DeviceDetail;