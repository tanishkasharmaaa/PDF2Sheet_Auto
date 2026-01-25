import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stack,
  Button,
  Badge,
} from "@chakra-ui/react";
import { useState } from "react";
import FakePaymentModel from "../components/FakePaymentModel";

const pricingPlans = [
  {
    name: "Free",
    price: "₹0",
    subtitle: "For getting started",
    features: [
      "20 invoices / month",
      "1 Google Spreadsheet",
      "Standard OCR",
      "Community support",
    ],
    isPopular: false,
  },
  {
    name: "Basic",
    price: "₹499",
    subtitle: "For freelancers & small teams",
    features: [
      "200 invoices / month",
      "3 Google Spreadsheets",
      "Faster OCR",
      "Email support",
    ],
    isPopular: true,
  },
  {
    name: "Pro",
    price: "₹1499",
    subtitle: "For growing businesses",
    features: [
      "Unlimited invoices",
      "Unlimited spreadsheets",
      "Advanced OCR",
      "Priority support",
    ],
    isPopular: false,
  },
];

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  return (
    <Box maxW="7xl" mx="auto" px={6} py={20}>
      <Stack spacing={4} textAlign="center" mb={16}>
        <Heading size="xl">Pricing that scales with you</Heading>
        <Text fontSize="lg" color="gray.400">
          Simple plans. No hidden charges.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
        {pricingPlans.map((plan) => (
          <Box
            key={plan.name}
            bg="#11162A"
            border="1px solid"
            borderColor={plan.isPopular ? "brand.500" : "gray.700"}
            rounded="2xl"
            p={8}
            position="relative"
            _hover={{ transform: "translateY(-6px)" }}
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

            <Stack spacing={6}>
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

              <Stack spacing={2} color="gray.300">
                {plan.features.map((f) => (
                  <Text key={f}>• {f}</Text>
                ))}
              </Stack>

              <Button
                size="lg"
                colorScheme="brand"
                variant={plan.isPopular ? "solid" : "outline"}
                onClick={() => plan.name !== "Free" && setSelectedPlan(plan)}
              >
                {plan.name === "Free" ? "Current Plan" : "Upgrade"}
              </Button>
            </Stack>
          </Box>
        ))}
      </SimpleGrid>

      {selectedPlan && (
        <FakePaymentModel
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan}
        />
      )}
    </Box>
  );
};

export default Pricing;
