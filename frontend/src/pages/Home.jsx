import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Badge,
  Stack
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";

const Home = () => {
  return (
    <Box>
      <Navbar/>
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
            colorScheme="blue"
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
              color="white"
              variant="outline"
              size="lg"
              _hover={{color:"black",bgColor:"whiteAlpha.900"}}
            >
              See How It Works
            </Button>
          </Flex>
        </VStack>
      </Flex>
{/* BENEFITS */}
<Box px={8} py={24} bg="whiteAlpha.100">
  <VStack spacing={12}>
    <VStack spacing={3}>
      <Heading size="lg">Why teams love PDF2Sheet Auto</Heading>
      <Text color="gray.400" maxW="600px" textAlign="center">
        Built to remove manual work and help businesses focus on what actually matters.
      </Text>
    </VStack>

    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
      {[
        { title: "Save Hours", desc: "Eliminate repetitive invoice data entry." },
        { title: "Any Invoice Format", desc: "Works with scanned & digital PDFs." },
        { title: "High Accuracy", desc: "Confidence scores for every extraction." },
        { title: "Batch Uploads", desc: "Upload multiple invoices at once." },
        { title: "Usage Based Plans", desc: "Pay only for what you process." },
        { title: "SMB Friendly", desc: "Designed for small teams & founders." },
      ].map((item, i) => (
        <Box
          key={i}
          p={6}
          borderRadius="2xl"
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.200"
          _hover={{
            transform: "translateY(-6px)",
            bg: "whiteAlpha.100",
          }}
          transition="all 0.3s"
        >
          <Heading size="md" mb={2}>
            {item.title}
          </Heading>
          <Text color="gray.400">{item.desc}</Text>
        </Box>
      ))}
    </SimpleGrid>
  </VStack>
</Box>
{/* PRICING PREVIEW */}
<Box px={8} py={24}>
  <Stack spacing={12} textAlign="center">
    <Stack spacing={3}>
      <Heading size="lg">Simple, transparent pricing</Heading>
      <Text color="gray.400">
        Choose a plan that fits your workflow. Upgrade anytime.
      </Text>
    </Stack>

    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} maxW="1100px" mx="auto">
      {[
        {
          name: "Free",
          price: "₹0",
          subtitle: "For getting started",
          features: ["20 invoices / month", "1 Spreadsheet"],
          isPopular: false,
        },
        {
          name: "Basic",
          price: "₹499",
          subtitle: "For freelancers & teams",
          features: ["200 invoices / month", "3 Spreadsheets"],
          isPopular: true,
        },
        {
          name: "Pro",
          price: "₹1499",
          subtitle: "For growing businesses",
          features: ["Unlimited invoices", "Unlimited sheets"],
          isPopular: false,
        },
      ].map((plan) => (
        <Box
          key={plan.name}
          bg="#11162A"
          border="1px solid"
          borderColor={plan.isPopular ? "brand.500" : "gray.700"}
          rounded="2xl"
          p={8}
          position="relative"
          _hover={{ transform: "translateY(-6px)" }}
          transition="all 0.3s"
        >
          {plan.isPopular && (
            <Badge
              position="absolute"
              top={4}
              right={4}
              bg="brand.500"
              color="white"
              rounded="full"
              px={3}
            >
              Most Popular
            </Badge>
          )}

          <Stack spacing={5} textAlign="center">
            <Box>
              <Heading size="md">{plan.name}</Heading>
              <Text color="gray.400">{plan.subtitle}</Text>
            </Box>

            <Heading size="2xl">
              {plan.price}
              <Text as="span" fontSize="md" color="gray.400">
                {" "}
                / month
              </Text>
            </Heading>

            <Stack spacing={1} color="gray.300">
              {plan.features.map((f) => (
                <Text key={f}>• {f}</Text>
              ))}
            </Stack>

            <Button
              as={Link}
              to={plan.name === "Free" ? "/signup" : "/pricing"}
              size="lg"
              colorScheme="brand"
              variant={plan.isPopular ? "solid" : "outline"}
            >
              {plan.name === "Free" ? "Start Free" : "View Plan"}
            </Button>
          </Stack>
        </Box>
      ))}
    </SimpleGrid>

    <Button
      as={Link}
      to="/pricing"
      variant="link"
      color="brand.400"
      fontSize="lg"
    >
      View full pricing →
    </Button>
  </Stack>
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
