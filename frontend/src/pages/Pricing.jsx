import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stack,
  Button,
  Badge,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import FakePaymentModel from "../components/FakePaymentModel";
import { Navbar } from "../components/Navbar";

const PLAN_ORDER = {
  Free: 0,
  Basic: 1,
  Pro: 2,
};

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
  },
];

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("accessToken");
  const isLoggedIn = !!token;

  const currentPlan = useMemo(() => {
    if (!isLoggedIn) return "Free";
    const userData = JSON.parse(localStorage.getItem("usersData") || "{}");
    return userData?.subscription.tier || "Free";
  }, [isLoggedIn]);

  const handlePlanClick = (plan) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setSelectedPlan(plan);
  };

  return (
    <>
      <Navbar />

      <Box maxW="7xl" mx="auto" px={6} py={20}>
        <Stack spacing={4} textAlign="center" mb={16}>
          <Heading size="xl">Pricing that scales with you</Heading>
          <Text fontSize="lg" color="gray.400">
            Simple plans. No hidden charges.
          </Text>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          {pricingPlans.map((plan) => {
            const isCurrent = plan.name === currentPlan;
            const canUpgrade = PLAN_ORDER[plan.name] > PLAN_ORDER[currentPlan];

            return (
              <Box
                key={plan.name}
                bg="#11162A"
                border="1px solid"
                borderColor={
                  isCurrent
                    ? "green.400"
                    : plan.isPopular
                      ? "brand.500"
                      : "gray.700"
                }
                rounded="2xl"
                p={8}
                position="relative"
                transition="all 0.2s"
                _hover={{ transform: "translateY(-6px)" }}
              >
                {isCurrent && (
                  <Badge
                    position="absolute"
                    top={4}
                    right={4}
                    bg="green.500"
                    color="white"
                    rounded="full"
                    px={3}
                  >
                    Current Plan
                  </Badge>
                )}

                {plan.isPopular && !isCurrent && (
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

                  {/* ✅ Button Logic */}
                  {isCurrent && (
                    <Button
                      size="lg"
                      variant="outline"
                      color={'white'}
                      _hover={{color:"black",bgColor:"white"}}
                      onClick={() => {
                        if (!isLoggedIn) navigate("/login");
                      }}
                    >
                      Current Plan
                    </Button>
                  )}

                  {canUpgrade && (
                    <Button
                      size="lg"
                      colorScheme="brand"
                      onClick={() => handlePlanClick(plan)}
                    >
                      Upgrade
                    </Button>
                  )}
                </Stack>
              </Box>
            );
          })}
        </SimpleGrid>

        {selectedPlan && (
          <FakePaymentModel
            isOpen={!!selectedPlan}
            onClose={() => setSelectedPlan(null)}
            plan={selectedPlan}
          />
        )}
      </Box>
    </>
  );
};

export default Pricing;
