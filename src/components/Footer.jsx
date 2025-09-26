import React from 'react';
import { Box, Container, Flex, HStack, Link, Text, IconButton, Stack, useColorModeValue } from '@chakra-ui/react';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const bg = useColorModeValue('gray.50', 'gray.900');
  const color = useColorModeValue('gray.600', 'gray.400');
  const navigate = useNavigate();

  return (
    <Box bg={bg} py={10} mt={20} borderTopWidth={1} borderColor={useColorModeValue('gray.200', 'gray.700')}>
      <Container maxW="container.xl">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          gap={6}
        >
          {/* Brand */}
          <Text fontWeight="bold" fontSize="lg">
            🌟 SmartLight
          </Text>

          {/* Quick Links */}
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            <Link cursor="pointer" onClick={() => navigate('/signup')}>Sign&nbsp;Up</Link>
            <Link cursor="pointer" onClick={() => navigate('/login')}>Log&nbsp;In</Link>
            <Link href="#features">Features</Link>

          </Stack>

          {/* Social */}
          <HStack spacing={3}>
            <IconButton as={Link} href="https://github.com" aria-label="GitHub" icon={<FaGithub />} variant="ghost" />
            <IconButton as={Link} href="https://twitter.com" aria-label="Twitter" icon={<FaTwitter />} variant="ghost" />
            <IconButton as={Link} href="https://linkedin.com" aria-label="LinkedIn" icon={<FaLinkedin />} variant="ghost" />
          </HStack>
        </Flex>

        <Text mt={6} textAlign="center" fontSize="sm" color={color}>
          © {new Date().getFullYear()} SmartLight. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
};

export default Footer;