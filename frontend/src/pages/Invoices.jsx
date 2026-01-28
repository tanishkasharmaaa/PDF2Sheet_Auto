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
  Select,
  Input,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Navbar } from "../components/Navbar";
import UploadInvoiceModal from "../components/UploadInvoivesModal";
import { userInvoices, usersInfo } from "../api/dashboardData";

const tierLimits = { Free: 20, Basic: 200, Pro: Infinity };

export const Invoices = () => {
  const navigate = useNavigate();
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const [invoices, setInvoices] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Filters
  const [filterSpreadsheet, setFilterSpreadsheet] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const user = await usersInfo();
      if (!user) return navigate("/login");
      setUserData(user);

      const invs = await userInvoices();
      setInvoices(invs?.invoices || []);
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSpreadsheet = filterSpreadsheet
        ? inv.spreadsheetId === filterSpreadsheet
        : true;
      const matchDate = filterDate
        ? inv.createdAt?.split("T")[0] === filterDate
        : true;
      return matchSpreadsheet && matchDate;
    });
  }, [invoices, filterSpreadsheet, filterDate]);

  const { avgConfidence, totalAmount, invoicesUsed, invoiceLimit } =
    useMemo(() => {
      const invoicesUsed = filteredInvoices.length;
      const subscriptionTier = userData?.subscription?.tier || "Free";
      const invoiceLimit = tierLimits[subscriptionTier] || 20;

      const totalConfidence =
        filteredInvoices.reduce(
          (sum, inv) => sum + (inv.confidenceScore || 0),
          0,
        ) || 0;
      const totalAmount =
        filteredInvoices.reduce(
          (sum, inv) => sum + (parseInt(inv.totalAmount) || 0),
          0,
        ) || 0;

      return {
        avgConfidence: invoicesUsed
          ? (totalConfidence / invoicesUsed) * 100
          : 0,
        totalAmount,
        invoicesUsed,
        invoiceLimit,
      };
    }, [filteredInvoices, userData]);

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  return (
    <>
      <Navbar />
      <Box px={{ base: 4, md: 8 }} py={8}>
        <Flex justify="space-between" mb={4} align="center">
          <Heading size="lg">Invoices</Heading>
          <Button onClick={() => setIsUploadOpen(true)}>Upload</Button>
        </Flex>

        {/* Filters */}
        <Flex gap={4} mb={6} wrap="wrap">
          <Select
            placeholder="Filter by Spreadsheet"
            value={filterSpreadsheet}
            onChange={(e) => setFilterSpreadsheet(e.target.value)}
            maxW="250px"
          >
            {userData.spreadsheets.map((ele, index) => (
              <option key={index} value={ele.spreadsheetId} style={{color:"black"}}>
                {ele.spreadsheetName}
              </option>
            ))}
          </Select>

          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            maxW="200px"
          />
        </Flex>

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

        {/* Table */}
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
                  <Th>Spreadsheet</Th>
                  <Th isNumeric>Total</Th>
                  <Th>Status</Th>
                  <Th>Confidence</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredInvoices.map((inv) => {
                  // Find the spreadsheet name from userData
                  const sheet = userData?.spreadsheets?.find(
                    (s) => s.spreadsheetId === inv.spreadsheetId,
                  );
                  const sheetName = sheet
                    ? sheet.spreadsheetName
                    : inv.spreadsheetId || "—";

                  return (
                    <Tr
                      key={inv._id}
                      _hover={{ bg: "whiteAlpha.100", cursor: "pointer" }}
                      onClick={() => navigate(`/invoices/${inv._id}`)}
                    >
                      <Td>{inv.invoiceNumber}</Td>
                      <Td>{inv.invoiceDate || "—"}</Td>
                      <Td>{sheetName}</Td>
                      <Td isNumeric>₹{inv.totalAmount}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            inv.status === "completed" ? "green" : "yellow"
                          }
                        >
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
                      <Td>
                        {inv.spreadsheetId && (
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `https://docs.google.com/spreadsheets/d/${inv.spreadsheetId}`,
                                "_blank",
                              );
                            }}
                          >
                            Open Sheet
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        ) : (
          <SimpleGrid columns={1} spacing={4}>
            {filteredInvoices.map((inv) => {
               const sheet = userData?.spreadsheets?.find(
                    (s) => s.spreadsheetId === inv.spreadsheetId,
                  );
                  const sheetName = sheet
                    ? sheet.spreadsheetName
                    : inv.spreadsheetId || "—";
              return (
              <Box
                key={inv._id}
                p={6}
                bg="whiteAlpha.50"
                borderRadius="2xl"
                border="1px solid"
                borderColor="whiteAlpha.200"
                onClick={() => navigate(`/invoices/${inv._id}`)}
              >
                <Heading size="sm" color={'green'}>{inv.invoiceNumber}</Heading>
                <Text><span style={{fontWeight:"600"}}>Date:</span> {inv.invoiceDate || "—"}</Text>
                <Text><span style={{fontWeight:"600"}}>Spreadsheet:</span> {sheetName || "—"}</Text>
                <Text> <span style={{fontWeight:"600"}}>Status:</span> {inv.status}</Text>
                <Text><span style={{fontWeight:"600"}}>Total:</span> ₹{inv.totalAmount}</Text>
                <Text>
                  <span style={{fontWeight:"600"}}>Confidence:</span> {Math.round((inv.confidenceScore || 0) * 100)}%
                </Text>
                {inv.spreadsheetId && (
                  <Button
                    mt={2}
                    size="sm"
                    colorScheme="blue"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `https://docs.google.com/spreadsheets/d/${inv.spreadsheetId}`,
                        "_blank",
                      );
                    }}
                  >
                    Open Sheet
                  </Button>
                )}
              </Box>
            )})}
          </SimpleGrid>
        )}

        {filteredInvoices.length === 0 && (
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

      {/* Upload Modal */}
      <UploadInvoiceModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={async () => {
          const updatedInvoices = await userInvoices();
          setInvoices(updatedInvoices?.invoices || []);
        }}
      />
    </>
  );
};
