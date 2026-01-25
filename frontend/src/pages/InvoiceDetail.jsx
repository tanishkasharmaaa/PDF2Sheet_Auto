import {
  Box,
  Heading,
  Text,
  Badge,
  SimpleGrid,
  Progress,
  Table,
  Tbody,
  Tr,
  Td,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getInvoiceByInvoiceId } from "../api/dashboardData";

const InvoiceDetail = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchInvoice() {
      setLoading(true);
      const data = await getInvoiceByInvoiceId(invoiceId);

      if (!data) {
        alert("Invoice not found");
        navigate("/"); 
        return;
      }

      setInvoice(data);
      setLoading(false);
    }

    fetchInvoice();
  }, [invoiceId, navigate]);

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  const confidencePercentage = invoice.confidenceScore * 100;

  // Helper: render extracted text
  const renderExtractedText = (extracted) => {
    if (!extracted) return "-";

    // If rawText exists, render it
    if (extracted.rawText) return extracted.rawText;

    // If it's a structured object, map over keys
    if (typeof extracted === "object") {
      return Object.entries(extracted).map(([key, value]) => (
        <Text key={key} whiteSpace="pre-wrap">
          <b>{key}:</b> {value}
        </Text>
      ));
    }

    // fallback: string
    return extracted;
  };

  return (
    <Box px={{ base: 4, md: 8 }} py={8}>
      {/* HEADER */}
      <Box mb={8}>
        <Heading size="lg">Invoice {invoice.invoiceNumber}</Heading>
        <Badge
          mt={2}
          colorScheme={
            invoice.status === "AUTO_PROCESSED"
              ? "green"
              : invoice.status === "PROCESSING"
              ? "yellow"
              : "red"
          }
        >
          {invoice.status}
        </Badge>
      </Box>

      {/* SUMMARY */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={12}>
        <SummaryCard label="Vendor" value={invoice.senderEmail} />
        <SummaryCard label="Invoice Date" value={invoice.invoiceDate} />
        <SummaryCard label="Total Amount" value={`₹${invoice.totalAmount}`} />
        <Box
          p={6}
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="2xl"
        >
          <Text color="gray.400">Confidence</Text>
          <Heading size="md" mt={1}>
            {Math.round(confidencePercentage)}%
          </Heading>
          <Progress
            mt={3}
            value={confidencePercentage}
            colorScheme={
              confidencePercentage > 80
                ? "green"
                : confidencePercentage > 60
                ? "yellow"
                : "red"
            }
            borderRadius="full"
          />
        </Box>
      </SimpleGrid>

      {/* EXTRACTED DATA */}
      <Box
        bg="whiteAlpha.50"
        border="1px solid"
        borderColor="whiteAlpha.200"
        borderRadius="2xl"
        p={6}
      >
        <Heading size="md" mb={4}>
          Extracted Fields
        </Heading>

        <Table variant="simple">
          <Tbody>
            <Tr>
              <Td color="gray.400" w="40%">
                Invoice Number
              </Td>
              <Td fontWeight="medium">{invoice.invoiceNumber}</Td>
            </Tr>
            <Tr>
              <Td color="gray.400">Invoice Date</Td>
              <Td fontWeight="medium">{invoice.invoiceDate}</Td>
            </Tr>
            <Tr>
              <Td color="gray.400">Vendor</Td>
              <Td fontWeight="medium">{invoice.senderEmail}</Td>
            </Tr>
            <Tr>
              <Td color="gray.400">Total Amount</Td>
              <Td fontWeight="medium">₹{invoice.totalAmount}</Td>
            </Tr>
            <Tr>
              <Td color="gray.400">Confidence</Td>
              <Td fontWeight="medium">{Math.round(confidencePercentage)}%</Td>
            </Tr>
            <Tr>
              <Td color="gray.400">Extracted Text</Td>
              <Td fontWeight="medium" whiteSpace="pre-wrap">
                {renderExtractedText(invoice.extractedText)}
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

const SummaryCard = ({ label, value }) => (
  <Box
    p={6}
    bg="whiteAlpha.50"
    border="1px solid"
    borderColor="whiteAlpha.200"
    borderRadius="2xl"
  >
    <Text color="gray.400">{label}</Text>
    <Heading size="md" mt={1}>
      {value}
    </Heading>
  </Box>
);

export default InvoiceDetail;
