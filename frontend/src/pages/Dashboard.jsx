import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Progress,
  Button,
  Badge,
  VStack,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import UploadInvoicesModal from "../components/UploadInvoivesModal";
import { usersInfo, userInvoices } from "../api/dashboardData";

const tierLimits = {
  Free: 20,
  Basic: 200,
  Pro: Infinity,
};

const Dashboard = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [usersData, setUsersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listOfInvoices, setListOfInvoices] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  // Fetch user info and invoices
  useEffect(() => {
    async function getData() {
      setLoading(true);

      const userInfo = await usersInfo();
      if (!userInfo) {
        navigate("/login");
        return;
      }
      setUsersData(userInfo);

      const invoicesData = await userInvoices();
      setListOfInvoices(invoicesData?.invoices || []);

      setLoading(false);
    }

    getData();
  }, [navigate]);

  // Extract subscription info
  const subscriptionTier = usersData?.subscription?.tier || "Free";
  const invoiceLimit = tierLimits[subscriptionTier];
  const invoicesUsed = listOfInvoices.length;

  // Memoized calculations for avg confidence and total amount
  const { avgConfidence, totalAmount } = useMemo(() => {
    if (listOfInvoices.length === 0) return { avgConfidence: 0, totalAmount: 0 };

    const totalConfidence = listOfInvoices.reduce(
      (sum, inv) => sum + (inv.confidenceScore || 0),
      0
    );
    const totalAmount = listOfInvoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.totalAmount) || 0),
      0
    );

    return {
      avgConfidence: (totalConfidence / listOfInvoices.length) * 100,
      totalAmount,
    };
  }, [listOfInvoices]);

  // Handle upload respecting subscription limit
  const handleUploadClick = () => {
    if (invoicesUsed >= invoiceLimit) {
      if (subscriptionTier === "Pro") {
        setIsUploadOpen(true); // Pro has unlimited uploads
      } else {
        toast({
          title: "Invoice Limit Reached",
          description: `Your ${subscriptionTier} plan allows only ${invoiceLimit} invoices.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    } else {
      setIsUploadOpen(true);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  return (
    <Box px={{ base: 4, md: 8 }} py={8}>
      {/* HEADER */}
      <Box mb={10}>
        <Heading size="lg">Welcome back, {usersData?.name || "User"} 👋</Heading>
        <Text color="gray.400">Here’s a quick overview of your invoice automation</Text>
      </Box>

      {/* STATS */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={12}>
        {/* Invoices Used */}
        <Box
          p={6}
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="2xl"
        >
          <Flex justify="space-between" mb={2}>
            <Text color="gray.400">Invoices Used</Text>
            <Badge colorScheme={subscriptionTier === "Free" ? "green" : "blue"}>
              {subscriptionTier}
            </Badge>
          </Flex>
          <Heading size="md">
            {invoicesUsed} / {invoiceLimit === Infinity ? "∞" : invoiceLimit}
          </Heading>
          {invoiceLimit !== Infinity && (
            <Progress
              mt={3}
              value={(invoicesUsed / invoiceLimit) * 100}
              colorScheme="brand"
              borderRadius="full"
            />
          )}
        </Box>

        {/* Subscription Tier */}
        <Box
          p={6}
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="2xl"
        >
          <Text color="gray.400">Subscription</Text>
          <Heading size="md" mt={2}>
            {subscriptionTier} Plan
          </Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Upgrade for higher limits
          </Text>
        </Box>

        {/* Avg Confidence & Total Amount */}
        <Box
          p={6}
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="2xl"
        >
          <Text color="gray.400">Avg Confidence</Text>
          <Heading size="md" mt={2}>{Math.round(avgConfidence)}%</Heading>
          <Text fontSize="sm" color="gray.500">
            Across {listOfInvoices.length} invoices
          </Text>

          <Text color="gray.400" mt={4}>Total Amount</Text>
          <Heading size="md">₹{totalAmount.toLocaleString()}</Heading>
        </Box>
      </SimpleGrid>

      {/* UPLOAD */}
      <Box
        p={8}
        mb={12}
        bgGradient="linear(to-r, #1a1f36, #0b0f1a)"
        borderRadius="2xl"
        border="1px solid"
        borderColor="whiteAlpha.200"
      >
        <VStack spacing={4} align="start">
          <Heading size="md">Upload Invoices</Heading>
          <Text color="gray.400">
            Upload single or multiple PDF invoices. We’ll extract and sync them automatically.
          </Text>

          <Flex gap={4} mt={2}>
            <Button colorScheme="brand" size="lg" onClick={handleUploadClick}>
              Upload PDF
            </Button>
          </Flex>

          <UploadInvoicesModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
          />
        </VStack>
      </Box>

      {/* RECENT ACTIVITY */}
      <Box>
        <Heading size="md" mb={4}>Recent Invoices</Heading>

        {listOfInvoices.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {listOfInvoices.map((invoice) => (
              <Box
                key={invoice._id}
                p={6}
                bg="whiteAlpha.50"
                borderRadius="2xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
              >
                <Heading size="sm">{invoice.fileName}</Heading>
                <Text fontSize="sm" color="gray.400">Invoice #: {invoice.invoiceNumber}</Text>
                <Text fontSize="sm" color="gray.400">Date: {invoice.invoiceDate}</Text>
                <Text fontSize="sm" color="gray.400">Status: {invoice.status}</Text>
                <Text fontSize="sm" color="gray.400">Total: ₹{invoice.totalAmount}</Text>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Confidence: {Math.round((invoice.confidenceScore || 0) * 100)}%
                </Text>
                <Button mt={2} onClick={() => navigate(`/invoices/${invoice._id}`)}>
                  View Detail
                </Button>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Box
            p={10}
            textAlign="center"
            bg="whiteAlpha.50"
            borderRadius="2xl"
            border="1px dashed"
            borderColor="whiteAlpha.300"
            mt={6}
          >
            <Text color="gray.400">No invoices uploaded yet.</Text>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Upload your first invoice to see it here.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
