import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Badge,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <Box>
      {/* HERO */}
      <Flex
        minH="85vh"
        align="center"
        justify="center"
        bgGradient="radial(circle at top, #1a1f36, #0b0f1a)"
        px={8}
      >
        <VStack spacing={6} textAlign="center" maxW="900px">
          <Badge
            colorScheme="brand"
            px={4}
            py={1}
            borderRadius="full"
          >
            Automate Invoice Entry
          </Badge>

          <Heading size="2xl" lineHeight="1.2">
            Convert PDF invoices into Google Sheets
            <Text as="span" color="brand.500"> automatically</Text>
          </Heading>

          <Text fontSize="lg" color="gray.400">
            Forward invoices by email or upload PDFs.
            We extract data and push it directly into your spreadsheet — no manual work.
          </Text>

          <Flex gap={4}>
            <Button
              as={Link}
              to="/signup"
              colorScheme="brand"
              size="lg"
            >
              Get Started Free
            </Button>

            <Button
              variant="outline"
              size="lg"
              borderColor="whiteAlpha.300"
            >
              See How It Works
            </Button>
          </Flex>
        </VStack>
      </Flex>
      {/* BENEFITS */}
      <Box px={8} py={20} bg="whiteAlpha.50">
        <VStack spacing={10}>
          <Heading size="lg">Why teams love PDF2Sheet Auto</Heading>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            {[
              "Save hours of manual data entry",
              "Works with any invoice format",
              "Confidence scores for accuracy",
              "Batch uploads supported",
              "Subscription-based limits",
              "Built for small businesses",
            ].map((text, i) => (
              <Box
                key={i}
                p={5}
                borderRadius="xl"
                bg="blackAlpha.300"
                textAlign="center"
              >
                <Text>{text}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Box>
      {/* PRICING */}
      <Box px={8} py={20}>
        <VStack spacing={10}>
          <Heading size="lg">Simple pricing</Heading>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            {[
              { tier: "Free", limit: "20 invoices" },
              { tier: "Basic", limit: "200 invoices" },
              { tier: "Pro", limit: "Unlimited invoices" },
            ].map((plan, i) => (
              <Box
                key={i}
                p={6}
                borderRadius="2xl"
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.200"
                textAlign="center"
              >
                <Heading size="md">{plan.tier}</Heading>
                <Text mt={2} color="gray.400">
                  {plan.limit}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Box>
      {/* FINAL CTA */}
      <Flex
        px={8}
        py={20}
        justify="center"
        bgGradient="linear(to-r, brand.600, brand.700)"
      >
        <VStack spacing={4}>
          <Heading size="lg">Ready to automate invoices?</Heading>
          <Button
            as={Link}
            to="/signup"
            size="lg"
            bg="black"
            color="white"
            _hover={{ bg: "gray.900" }}
          >
            Start Free Today
          </Button>
        </VStack>
      </Flex>
    </Box>
  );
};

export default Home;
