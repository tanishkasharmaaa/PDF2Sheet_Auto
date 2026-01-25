import { StatusBadge } from "./StatusBadge";
import { Flex,Box,Text } from "@chakra-ui/react";
import { ConfidenceBar } from "./ConfidenceBar";

export const InvoiceCard = ({ invoice, onClick }) => (
  <Box
    p={5}
    bg="whiteAlpha.50"
    borderRadius="2xl"
    border="1px solid"
    borderColor="whiteAlpha.200"
    _hover={{ bg: "whiteAlpha.100" }}
    cursor="pointer"
    onClick={onClick}
  >
    <Flex justify="space-between" mb={2}>
      <Text fontWeight="bold">{invoice.invoiceNumber}</Text>
      <StatusBadge status={invoice.status} />
    </Flex>

    <Text fontSize="sm" color="gray.400">
      Date: {invoice.invoiceDate || "—"}
    </Text>

    <Text fontSize="sm" mt={1}>
      Total: <b>₹{invoice.totalAmount}</b>
    </Text>

    <Box mt={3}>
      <Text fontSize="xs" color="gray.400" mb={1}>
        Confidence
      </Text>
      <ConfidenceBar score={invoice.confidenceScore} />
    </Box>
  </Box>
);
