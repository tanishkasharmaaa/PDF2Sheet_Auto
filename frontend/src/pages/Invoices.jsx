import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  SimpleGrid,
  Flex,
  Spinner,
  Progress,
  Badge,
  Button,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { userInvoices, usersInfo } from "../api/dashboardData";
import { useEffect, useState, useMemo } from "react";
import { Navbar } from "../components/Navbar";

const tierLimits = {
  Free: 20,
  Basic: 200,
  Pro: Infinity,
};

export const Invoices = () => {
  const navigate = useNavigate();
  const isDesktop = useBreakpointValue({ base: false, md: true });

  const [invoices, setInvoices] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const userInfo = await usersInfo();
      if (!userInfo) return navigate("/login");
      setUserData(userInfo);

      const invoicesData = await userInvoices();
      setInvoices(invoicesData?.invoices || []);
      setLoading(false);
    }
    fetchData();
  }, [navigate]);

  // Memoized calculations
  const { avgConfidence, totalAmount, invoicesUsed, invoiceLimit } = useMemo(() => {
    const invoicesUsed = invoices.length;
    const subscriptionTier = userData?.subscription?.tier || "Free";
    const invoiceLimit = tierLimits[subscriptionTier] || 20;

    const totalConfidence =
      invoices.reduce((sum, inv) => sum + (inv.confidenceScore || 0), 0) || 0;
    const totalAmount =
      invoices.reduce((sum, inv) => sum + (parseInt(inv.totalAmount) || 0), 0) || 0;

    return {
      avgConfidence: invoicesUsed ? (totalConfidence / invoicesUsed) * 100 : 0,
      totalAmount,
      invoicesUsed,
      invoiceLimit,
    };
  }, [invoices, userData]);


  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  return (<>
    <Navbar/>
    <Box px={{ base: 4, md: 8 }} py={8}>
      {/* HEADER */}
      <Flex justify="space-between" mb={6} align="center">
        <Heading size="lg">Invoices</Heading>
        
      </Flex>

      {/* TOTAL & AVG CONFIDENCE */}
      <Flex mb={6} gap={6} wrap="wrap">
        <Box p={4} bg="whiteAlpha.50" borderRadius="2xl" flex="1">
          <Text color="gray.400">Invoices Used</Text>
          <Heading size="md">
            {invoicesUsed} / {invoiceLimit === Infinity ? "∞" : invoiceLimit}
          </Heading>
          {invoiceLimit !== Infinity && (
            <Progress
              mt={2}
              value={(invoicesUsed / invoiceLimit) * 100}
              colorScheme="brand"
              borderRadius="full"
            />
          )}
        </Box>
        <Box p={4} bg="whiteAlpha.50" borderRadius="2xl" flex="1">
          <Text color="gray.400">Average Confidence</Text>
          <Heading size="md">{Math.round(avgConfidence)}%</Heading>
        </Box>
        <Box p={4} bg="whiteAlpha.50" borderRadius="2xl" flex="1">
          <Text color="gray.400">Total Amount</Text>
          <Heading size="md">₹{totalAmount.toLocaleString()}</Heading>
        </Box>
      </Flex>

      {/* DESKTOP TABLE */}
      {isDesktop ? (
        <Box
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="2xl"
          overflow="hidden"
        >
          <Table>
            <Thead bg="blackAlpha.400">
              <Tr>
                <Th>Invoice #</Th>
                <Th>Date</Th>
                <Th isNumeric>Total</Th>
                <Th>Status</Th>
                <Th>Confidence</Th>
              </Tr>
            </Thead>
            <Tbody>
              {invoices.map((inv) => (
                <Tr
                  key={inv._id}
                  _hover={{ bg: "whiteAlpha.100", cursor: "pointer" }}
                  onClick={() => navigate(`/invoices/${inv._id}`)}
                >
                  <Td>{inv.invoiceNumber}</Td>
                  <Td>{inv.invoiceDate || "—"}</Td>
                  <Td isNumeric>₹{inv.totalAmount}</Td>
                  <Td>
                    <Badge colorScheme={inv.status === "completed" ? "green" : "yellow"}>
                      {inv.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Progress
                      value={(inv.confidenceScore || 0) * 100}
                      size="sm"
                      colorScheme={
                        inv.confidenceScore > 0.8
                          ? "green"
                          : inv.confidenceScore > 0.6
                          ? "yellow"
                          : "red"
                      }
                      borderRadius="full"
                    />
                    <Text fontSize="sm">
                      {Math.round((inv.confidenceScore || 0) * 100)}%
                    </Text>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : (
        /* MOBILE CARDS */
        <SimpleGrid columns={1} spacing={4}>
          {invoices.map((inv) => (
            <Box
              key={inv._id}
              p={6}
              bg="whiteAlpha.50"
              borderRadius="2xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              onClick={() => navigate(`/invoices/${inv._id}`)}
            >
              <Heading size="sm">{inv.invoiceNumber}</Heading>
              <Text>Date: {inv.invoiceDate || "—"}</Text>
              <Text>Status: {inv.status}</Text>
              <Text>Total: ₹{inv.totalAmount}</Text>
              <Text>Confidence: {Math.round((inv.confidenceScore || 0) * 100)}%</Text>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* EMPTY STATE */}
      {invoices.length === 0 && (
        <Box
          p={10}
          textAlign="center"
          bg="whiteAlpha.50"
          borderRadius="2xl"
          border="1px dashed"
          borderColor="whiteAlpha.300"
          mt={6}
        >
          <Text color="gray.400">No invoices found</Text>
        </Box>
      )}
    </Box>
  </>);
};
