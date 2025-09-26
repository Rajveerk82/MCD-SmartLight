import React, { useEffect, useState, Suspense } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Icon,
  Button,
  VStack,
  HStack,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Image,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Flex,
  chakra,

  Input,
  InputGroup,
  InputLeftElement,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers,
  FiActivity,
  FiAward,
  FiTrendingUp,
  FiMonitor,
  FiShield,
  FiCpu,
  FiZap,
  FiWifi,
  FiSettings,
  FiCheck,
  FiArrowRight,
} from 'react-icons/fi';
import { FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const MotionBox = chakra(motion.div);
const MotionFlex = chakra(motion.div, {
  
  baseStyle: { display: 'flex' },
});

// Feature Card Component
const Feature = ({ title, text, icon, delay }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 15, delay }}
      as={Card}
      height="100%"
      bg={useColorModeValue('white', 'gray.800')}
      boxShadow={isHovered ? '2xl' : 'xl'}
      rounded={'xl'}
      overflow={'hidden'} 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)} 
       transformOrigin="center bottom"
       transform={isHovered ? 'perspective(700px) scale(1.05) translateY(-10px)' : 'perspective(700px) scale(1)'} 
      // CSS transition handled by Framer Motion's transition prop above
      >
      <CardBody>
        <VStack spacing={6} align="start">
          <MotionBox
            animate={{
              rotate: isHovered ? [0, 15, -15, 0] : 0,
              scale: isHovered ? 1.2 : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            <Icon as={icon} w={12} h={12} color="blue.500" />
          </MotionBox>
          <Box>
            <Heading 
              size="md" 
              mb={3}
              bgGradient={isHovered ? "linear(to-r, blue.400, purple.500)" : "none"}
              bgClip={isHovered ? "text" : "inherit"}
            >
              {title}
            </Heading>
            <Text 
              color={useColorModeValue('gray.600', 'gray.400')}
              fontSize="lg"
            >
              {text}
            </Text>
          </Box>
          {isHovered && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                colorScheme="blue"
                rightIcon={<Icon as={FiArrowRight} />}
                size="sm"
              >
                Learn more
              </Button>
            </MotionBox>
          )}
        </VStack>
      </CardBody>
    </MotionBox>
  );
};

// Animated Stat Card
const StatCard = ({ label, number, helpText, icon, delay }) => {
  const [count, setCount] = useState(0);
  const targetNumber = parseInt(number);

  useEffect(() => {
    let start = 0;
    const increment = targetNumber / 50;
    const timer = setInterval(() => {
      start += increment;
      if (start > targetNumber) {
        setCount(targetNumber);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 30);

    return () => clearInterval(timer);
  }, [targetNumber]);

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      as={Card}
      bg={useColorModeValue('white', 'gray.800')}
      boxShadow={'xl'}
      rounded={'xl'}
      overflow={'hidden'}
      _hover={{ transform: 'translateY(-5px)', transition: 'all 0.3s ease' }}
    >
      <CardBody>
        <HStack spacing={4}>
          <Icon as={icon} w={10} h={10} color="blue.500" />
          <Stat>
            <StatLabel fontSize="lg">{label}</StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold">
              {count}
              {label === 'Uptime' || label === 'Performance' ? '%' : ''}
            </StatNumber>
            <StatHelpText>{helpText}</StatHelpText>
          </Stat>
        </HStack>
      </CardBody>
    </MotionBox>
  );
};

// Pricing Card Component
const PricingCard = ({ title, price, features, isPopular }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        bg={useColorModeValue('white', 'gray.800')}
        boxShadow={isHovered ? '2xl' : 'xl'}
        rounded={'xl'}
        overflow={'hidden'}
        position="relative"
        border={isPopular ? '2px solid' : 'none'}
        borderColor="blue.500"
        transform={isHovered ? 'translateY(-10px)' : 'none'}
        transition="all 0.3s ease"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isPopular && (
          <Badge
            position="absolute"
            top={2}
            right={2}
            colorScheme="blue"
            variant="solid"
            rounded="md"
          >
            Most Popular
          </Badge>
        )}
        <CardBody>
          <VStack spacing={6}>
            <Heading 
              size="lg"
              bgGradient={isHovered ? "linear(to-r, blue.400, purple.500)" : "none"}
              bgClip={isHovered ? "text" : "inherit"}
            >
              {title}
            </Heading>
            <HStack>
              <Text fontSize="3xl" fontWeight="bold">
                ₹
              </Text>
              <Text 
                fontSize="6xl" 
                fontWeight="bold"
                bgGradient={isHovered ? "linear(to-r, blue.400, purple.500)" : "none"}
                bgClip={isHovered ? "text" : "inherit"}
              >
                {price}
              </Text>
              <Text fontSize="xl">/mo</Text>
            </HStack>
            <VStack align="start" spacing={4} w="100%">
              {features.map((feature, index) => (
                <HStack key={index}>
                  <Icon 
                    as={FiCheck} 
                    color={isHovered ? "blue.500" : "green.500"}
                    transform={isHovered ? 'scale(1.2)' : 'scale(1)'}
                    transition="all 0.3s ease"
                  />
                  <Text>{feature}</Text>
                </HStack>
              ))}
            </VStack>
            <Button
              w="100%"
              size="lg"
              colorScheme={isPopular ? 'blue' : 'gray'}
              variant={isPopular ? 'solid' : 'outline'}
              _hover={{
                transform: 'scale(1.05)',
                boxShadow: 'lg',
              }}
            >
              Get Started
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  );
};

// FAQ Component
const FAQItem = ({ question, answer, isVisible }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <MotionBox
      initial={{ opacity: 0, height: 0 }}
      animate={{ 
        opacity: isVisible ? 1 : 0,
        height: isVisible ? 'auto' : 0,
      }}
      transition={{ duration: 0.3 }}
    >
      <AccordionItem
        border="none"
        mb={4}
        bg={useColorModeValue('white', 'gray.800')}
        rounded="lg"
        boxShadow={isHovered ? 'lg' : 'md'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        transition="all 0.3s ease"
      >
        <h2>
          <AccordionButton 
            py={6}
            _hover={{ bg: 'transparent' }}
          >
            <Box flex="1" textAlign="left">
              <Text
                fontWeight="semibold"
                fontSize="lg"
                color={isHovered ? 'blue.500' : 'gray.700'}
                transition="all 0.3s ease"
              >
                {question}
              </Text>
            </Box>
            <MotionBox
              animate={{ rotate: isHovered ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <AccordionIcon />
            </MotionBox>
          </AccordionButton>
        </h2>
        <AccordionPanel pb={6}>
          <MotionBox
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Text 
              color={useColorModeValue('gray.600', 'gray.400')}
              fontSize="md"
              lineHeight="tall"
            >
              {answer}
            </Text>
          </MotionBox>
        </AccordionPanel>
      </AccordionItem>
    </MotionBox>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  
  const bgGradient = useColorModeValue(
    'linear(to-r, blue.100, purple.100)',
    'linear(to-r, blue.900, purple.900)'
  );

  return (
    <>
      <Header />
      <Box>
      {/* Hero Section */}
      <Box
        bgGradient={bgGradient}
        py={32}
        px={4}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <MotionFlex
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            direction={{ base: 'column', lg: 'row' }}
            align="center"
            justify="space-between"
            gap={8}
          >
            <VStack
              align={{ base: 'center', lg: 'start' }}
              spacing={8}
              maxW={{ base: 'full', lg: '50%' }}
              textAlign={{ base: 'center', lg: 'left' }}
            >
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Heading
                  as="h1"
                  size="2xl"
                  bgGradient="linear(to-r, blue.400, purple.500)"
                  bgClip="text"
                  letterSpacing="tight"
                  mb={4}
                >
                  Smart Device Management Made Simple
                </Heading>
                <Text
                  fontSize="xl"
                  color={useColorModeValue('gray.600', 'gray.300')}
                  mb={8}
                >
                  Monitor, control, and optimize your devices from anywhere. Get real-time insights and automated management for peak performance.
                </Text>
                
                <InputGroup size="lg" maxW="md" mb={8}>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search devices or features..."
                    bg={useColorModeValue('white', 'gray.800')}
                    border="2px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    _hover={{
                      borderColor: 'blue.400',
                    }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>

                <HStack spacing={4}>
                  <Button
                    size="lg"
                    colorScheme="blue"
                    onClick={() => navigate('/login')}
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={onOpen}
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                  >
                    Watch Demo
                  </Button>
                </HStack>
              </MotionBox>
            </VStack>
            <Box
              flex={1}
              h="400px"
              position="relative"
              display={{ base: 'none', lg: 'block' }}
            >
              <MotionBox
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                position="relative"
                w="full"
                h="full"
              >
                <motion.img
                  src="https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
                  alt="Smart Device Management"
                  style={{
                    objectFit: 'cover',
                    borderRadius: '1.5rem',
                    width: '100%',
                    height: '100%',
                    filter: 'brightness(0.9)',
                    transform: 'perspective(1000px) rotateY(-15deg)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  }}
                  whileHover={{
                    transform: 'perspective(1000px) rotateY(-5deg)',
                    transition: 'all 0.3s ease',
                  }}
                />
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  w="full"
                  h="full"
                  bgGradient="linear(to-r, blue.500, purple.500)"
                  opacity="0.2"
                  borderRadius="2xl"
                />
              </MotionBox>
            </Box>
          </MotionFlex>
        </Container>
      </Box>

      {/* Demo Video Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Product Demo</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box as="iframe"
              src="https://www.youtube.com/embed/demo-video-id"
              width="100%"
              height="480px"
              borderRadius="md"
              allowFullScreen
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Stats Section */}
      <Container maxW="container.xl" py={16}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
          <StatCard
            label="Total Devices"
            number="1000"
            helpText="Active devices"
            icon={FiActivity}
            delay={0.1}
          />
          <StatCard
            label="Users"
            number="5000"
            helpText="Registered users"
            icon={FiUsers}
            delay={0.2}
          />
          <StatCard
            label="Uptime"
            number="99.9"
            helpText="Last 30 days"
            icon={FiTrendingUp}
            delay={0.3}
          />
          <StatCard
            label="Performance"
            number="98"
            helpText="System efficiency"
            icon={FiAward}
            delay={0.4}
          />
        </SimpleGrid>
      </Container>

      {/* Features Section */}
      <Box id="features" bg={useColorModeValue('gray.50', 'gray.900')} py={16}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6 }}
            >
              <Heading
                textAlign="center"
                size="xl"
                mb={4}
                bgGradient="linear(to-r, blue.400, purple.500)"
                bgClip="text"
              >
                Powerful Features for Smart Control
              </Heading>
            </motion.div>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Feature
                  icon={FiMonitor}
                  title="Real-time Monitoring"
                  text="Track device status, performance metrics, and alerts instantly from anywhere."
                  delay={0}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Feature
                  icon={FiShield}
                  title="Advanced Security"
                  text="Enterprise-grade encryption and authentication for your device network."
                  delay={0}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Feature
                  icon={FiCpu}
                  title="Smart Automation"
                  text="Create custom rules and schedules for automated device control."
                  delay={0}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Feature
                  icon={FiZap}
                  title="Energy Management"
                  text="Optimize power consumption and reduce operational costs."
                  delay={0}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Feature
                  icon={FiWifi}
                  title="Remote Access"
                  text="Control and monitor your devices from anywhere in the world."
                  delay={0}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Feature
                  icon={FiSettings}
                  title="Custom Integration"
                  text="Easy integration with existing systems and third-party devices."
                  delay={0}
                />
              </motion.div>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Video Demo Section */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8}>
          <Heading textAlign="center" size="xl">
            See It In Action
          </Heading>
          <Box
            w="100%"
            h={{ base: '300px', md: '500px' }}
            bg="gray.200"
            rounded="xl"
            overflow="hidden"
          >
            {/* Replace with actual video component */}
            <Box
              w="100%"
              h="100%"
              bg="gray.300"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text>Demo Video Coming Soon</Text>
            </Box>
          </Box>
        </VStack>
      </Container>

      </Box>
      <Footer />
    </>
  );
};

export default Home;