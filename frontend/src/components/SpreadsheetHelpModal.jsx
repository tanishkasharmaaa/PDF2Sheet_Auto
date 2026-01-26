import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Box,
  Image,
  Button,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";

const SERVICE_EMAIL = "service-account-225@pdf2sheet-485215.iam.gserviceaccount.com";

const SpreadsheetHelpModal = ({ isOpen, onClose }) => {
  const toast = useToast();

  const copyEmail = async () => {
    await navigator.clipboard.writeText(SERVICE_EMAIL);
    toast({
      title: "Email copied",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="#11162A" borderRadius="2xl" color="gray.100">
        <ModalHeader fontSize="2xl" fontWeight="semibold" color="brand.500">
          Connect Your Google Spreadsheet
        </ModalHeader>
        <ModalCloseButton color="gray.400" _hover={{ color: "white" }} />

        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Step 1 */}
            <Box bg="#0F1424" border="1px solid" borderColor="gray.700" borderRadius="xl" p={4}>
              <Text fontWeight="semibold">
                1. Open Google Sheets and create a new spreadsheet (or open an existing one).
              </Text>
            </Box>

            {/* Step 2 */}
            <Box bg="#0F1424" border="1px solid" borderColor="gray.700" borderRadius="xl" p={4}>
              <Text fontWeight="semibold">
                2. Click the Share button in the top-right corner.
              </Text>
            </Box>

            {/* Step 3 */}
            <Box bg="#0F1424" border="1px solid" borderColor="gray.700" borderRadius="xl" p={4}>
              <Text fontWeight="semibold" mb={2}>
                3. Add this service email:
              </Text>
              <HStack
                justify="space-between"
                bg="#11162A"
                border="1px solid"
                borderColor="gray.700"
                borderRadius="md"
                p={3}
              >
                <Text fontFamily="mono" fontSize="sm" color="brand.400" wordBreak="break-all">
                  {SERVICE_EMAIL}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="brand"
                  leftIcon={<CopyIcon />}
                  onClick={copyEmail}
                >
                  Copy
                </Button>
              </HStack>
            </Box>

            {/* Step 4 */}
            <Box bg="#0F1424" border="1px solid" borderColor="gray.700" borderRadius="xl" p={4}>
              <Text fontWeight="semibold">
                4. Give Editor permission and save the changes.
              </Text>
            </Box>

            {/* Step 5 */}
            <Box bg="#0F1424" border="1px solid" borderColor="gray.700" borderRadius="xl" p={4}>
              <Text fontWeight="semibold">
                5. Copy the Spreadsheet ID from the URL and paste it in the app.
              </Text>
            </Box>

            {/* Example Image */}
            <Box mt={4} border="1px solid" borderColor="gray.700" borderRadius="xl" overflow="hidden">
              <Image
                src="/SpreadSheetId_example.png"
                alt="Spreadsheet ID example"
                objectFit="contain"
                w="100%"
                maxH="280px"
              />
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SpreadsheetHelpModal;
