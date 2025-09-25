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
  Select,
  Switch,
  HStack,
  VStack,
  Flex,
  IconButton,
  Badge,
  useToast,
  useColorModeValue,
  Divider,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Icon,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiClock,
  FiPower,
  FiCalendar,
  FiRepeat,
  FiInfo,
  FiAlertCircle,
} from 'react-icons/fi';
import { database } from '../firebase/config';
import { ref, onValue, push, set, remove, update } from 'firebase/database';

const Schedule = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [devices, setDevices] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    deviceId: '',
    name: '',
    startTime: '',
    endTime: '',
    days: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    status: 'on',
    isActive: true,
  });

  useEffect(() => {
    // Fetch devices
    const devicesRef = ref(database, 'devices');
    const devicesUnsubscribe = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const devicesList = Object.entries(data).map(([id, device]) => ({
          id,
          ...device,
        }));
        setDevices(devicesList);
      }
    });

    // Fetch schedules
    const schedulesRef = ref(database, 'schedules');
    const schedulesUnsubscribe = onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const schedulesList = Object.entries(data).map(([id, schedule]) => ({
          id,
          ...schedule,
        }));
        setSchedules(schedulesList);
      } else {
        setSchedules([]);
      }
      setLoading(false);
    });

    return () => {
      devicesUnsubscribe();
      schedulesUnsubscribe();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: !prev.days[day],
      },
    }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const resetForm = () => {
    setFormData({
      deviceId: '',
      name: '',
      startTime: '',
      endTime: '',
      days: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      status: 'on',
      isActive: true,
    });
    setEditingSchedule(null);
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      deviceId: schedule.deviceId,
      name: schedule.name,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      days: schedule.days || {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      status: schedule.status,
      isActive: schedule.isActive,
    });
    onOpen();
  };

  const validateForm = () => {
    if (!formData.deviceId) {
      toast({
        title: 'Device required',
        description: 'Please select a device for this schedule.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!formData.name) {
      toast({
        title: 'Name required',
        description: 'Please provide a name for this schedule.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!formData.startTime) {
      toast({
        title: 'Start time required',
        description: 'Please set a start time for this schedule.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (!formData.endTime) {
      toast({
        title: 'End time required',
        description: 'Please set an end time for this schedule.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    const anyDaySelected = Object.values(formData.days).some((day) => day);
    if (!anyDaySelected) {
      toast({
        title: 'Days required',
        description: 'Please select at least one day for this schedule.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduleData = {
        ...formData,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
      };

      if (editingSchedule) {
        // Update existing schedule
        const scheduleRef = ref(database, `schedules/${editingSchedule.id}`);
        await update(scheduleRef, scheduleData);
        toast({
          title: 'Schedule updated',
          description: 'The schedule has been updated successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new schedule
        const schedulesRef = ref(database, 'schedules');
        await push(schedulesRef, scheduleData);
        toast({
          title: 'Schedule created',
          description: 'New schedule has been created successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingSchedule ? 'update' : 'create'} schedule: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        const scheduleRef = ref(database, `schedules/${scheduleId}`);
        await remove(scheduleRef);
        toast({
          title: 'Schedule deleted',
          description: 'The schedule has been deleted successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to delete schedule: ${error.message}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const toggleScheduleActive = async (schedule) => {
    try {
      const scheduleRef = ref(database, `schedules/${schedule.id}`);
      await update(scheduleRef, {
        isActive: !schedule.isActive,
        updatedAt: new Date().getTime(),
      });
      toast({
        title: schedule.isActive ? 'Schedule deactivated' : 'Schedule activated',
        description: `The schedule has been ${schedule.isActive ? 'deactivated' : 'activated'} successfully.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update schedule: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getDeviceName = (deviceId) => {
    const device = devices.find((d) => d.id === deviceId);
    return device ? device.name || `Device ${deviceId.slice(0, 8)}` : 'Unknown Device';
  };

  const getSelectedDays = (days) => {
    if (!days) return 'No days selected';
    
    const selectedDays = Object.entries(days)
      .filter(([_, isSelected]) => isSelected)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3));
    
    return selectedDays.length > 0 ? selectedDays.join(', ') : 'No days selected';
  };

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="blue.600">Schedule Management</Heading>
          <Text color="gray.500">Create and manage automated schedules for your devices</Text>
        </Box>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={() => {
            resetForm();
            onOpen();
          }}
        >
          Add Schedule
        </Button>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" minH="300px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : schedules.length === 0 ? (
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
          <CardBody>
            <Flex direction="column" align="center" justify="center" py={10}>
              <Icon as={FiCalendar} boxSize={12} color="gray.400" mb={4} />
              <Heading size="md" textAlign="center" mb={2}>No Schedules Found</Heading>
              <Text textAlign="center" color="gray.500" mb={6}>
                You haven't created any schedules yet. Create a schedule to automate your devices.
              </Text>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                onClick={() => {
                  resetForm();
                  onOpen();
                }}
              >
                Create Your First Schedule
              </Button>
            </Flex>
          </CardBody>
        </Card>
      ) : (
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden" boxShadow="md">
          <CardHeader pb={0}>
            <Heading size="md">Active Schedules</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Device</Th>
                  <Th>Time</Th>
                  <Th>Days</Th>
                  <Th>Action</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {schedules.map((schedule) => (
                  <Tr key={schedule.id}>
                    <Td>
                      <Text fontWeight="medium">{schedule.name}</Text>
                    </Td>
                    <Td>{getDeviceName(schedule.deviceId)}</Td>
                    <Td>
                      <Flex align="center">
                        <Icon as={FiClock} mr={2} color="gray.500" />
                        <Text>{schedule.startTime} - {schedule.endTime}</Text>
                      </Flex>
                    </Td>
                    <Td>{getSelectedDays(schedule.days)}</Td>
                    <Td>
                      <Badge colorScheme={schedule.status === 'on' ? 'green' : 'red'}>
                        {schedule.status === 'on' ? 'Turn ON' : 'Turn OFF'}
                      </Badge>
                    </Td>
                    <Td>
                      <Switch
                        isChecked={schedule.isActive}
                        onChange={() => toggleScheduleActive(schedule)}
                        colorScheme="blue"
                      />
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          icon={<FiEdit2 />}
                          aria-label="Edit schedule"
                          size="sm"
                          onClick={() => openEditModal(schedule)}
                        />
                        <IconButton
                          icon={<FiTrash2 />}
                          aria-label="Delete schedule"
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Schedule Form Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Device</FormLabel>
                  <Select
                    name="deviceId"
                    value={formData.deviceId}
                    onChange={handleInputChange}
                    placeholder="Select device"
                  >
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name || `Device ${device.id.slice(0, 8)}`}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Schedule Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter schedule name"
                  />
                </FormControl>

                <SimpleGrid columns={2} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Start Time</FormLabel>
                    <Input
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleInputChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>End Time</FormLabel>
                    <Input
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Days</FormLabel>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                    {Object.entries(formData.days).map(([day, isSelected]) => (
                      <Button
                        key={day}
                        size="sm"
                        variant={isSelected ? 'solid' : 'outline'}
                        colorScheme={isSelected ? 'blue' : 'gray'}
                        onClick={() => handleDayToggle(day)}
                        leftIcon={<FiCalendar />}
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </Button>
                    ))}
                  </SimpleGrid>
                </FormControl>

                <FormControl>
                  <FormLabel>Action</FormLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="on">Turn ON</option>
                    <option value="off">Turn OFF</option>
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="isActive" mb="0">
                    Active
                  </FormLabel>
                  <Switch
                    id="isActive"
                    name="isActive"
                    isChecked={formData.isActive}
                    onChange={handleSwitchChange}
                    colorScheme="blue"
                  />
                </FormControl>

                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">How scheduling works:</Text>
                    <Text fontSize="sm">
                      The device will {formData.status === 'on' ? 'turn ON' : 'turn OFF'} at the start time and remain in that state until the end time on the selected days.
                    </Text>
                  </Box>
                </Alert>
              </VStack>
            </form>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText={editingSchedule ? 'Updating...' : 'Creating...'}
            >
              {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Schedule;