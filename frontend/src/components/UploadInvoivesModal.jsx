import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Input,
  Text,
  VStack,
  Badge,
  Box,
  Select,
  useToast,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import axios from "axios";

const ALLOWED_TYPES = [
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const UploadInvoiceModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState(null);
  const [userData, setUserData] = useState({});
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setSelectedSpreadsheet(null);
    }

    // Load user data from localStorage
    const storedUserData = JSON.parse(localStorage.getItem("usersData") || "{}");
    setUserData(storedUserData);

    // Set default spreadsheet for Free plan or first spreadsheet
    if (storedUserData?.spreadsheets?.length > 0) {
      setSelectedSpreadsheet(storedUserData.spreadsheets[0]);
    }
  }, [isOpen]);

  const getFileFingerprint = (file, userId) => {
    return `${userId}_${file.name}_${file.size}_${file.lastModified}`;
  };

  const getUploadedFiles = () => {
    return JSON.parse(localStorage.getItem("uploadedInvoices") || "[]");
  };

  const saveUploadedFile = (fingerprint) => {
    const existing = getUploadedFiles();
    localStorage.setItem(
      "uploadedInvoices",
      JSON.stringify([...existing, fingerprint])
    );
  };

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const userId = userData.userId;
    if (!userId) {
      toast({
        title: "User not found",
        description: "Please login again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      e.target.value = null;
      return;
    }

    const fingerprint = getFileFingerprint(selectedFile, userId);
    if (getUploadedFiles().includes(fingerprint)) {
      toast({
        title: "Duplicate file detected",
        description: "You already uploaded this invoice",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      e.target.value = null;
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) return;
    if (!selectedSpreadsheet) {
      toast({
        title: "No spreadsheet selected",
        description: "Please select a spreadsheet to upload the invoice",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("invoice", file);
      formData.append("spreadsheetId", selectedSpreadsheet.spreadsheetId);

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}/email/receive`,
        formData,
        { withCredentials: true }
      );

      // Save fingerprint AFTER success
      const fingerprint = getFileFingerprint(file, userData.userId);
      saveUploadedFile(fingerprint);

      toast({
        title: "Invoice uploaded",
        description: `Invoice will be added to "${selectedSpreadsheet.spreadsheetName || selectedSpreadsheet.spreadsheetId}"`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      onUploadSuccess?.();
      window.location.reload();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const subscriptionTier = userData?.subscription?.tier || "Free";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="#11162A" borderRadius="2xl">
        <ModalHeader color="gray.100">Upload Invoice</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Spreadsheet selector for Basic/Pro */}
            {subscriptionTier !== "Free" && userData?.spreadsheets?.length > 0 && (
              <Box>
                <Text mb={1} color="gray.400">
                  Select Spreadsheet:
                </Text>
                <Select
                  bg="#0B0F1A"
                  borderColor="gray.700"
                  _hover={{ borderColor: "brand.500" }}
                  _focus={{ borderColor: "brand.500" }}
                  value={selectedSpreadsheet?.spreadsheetId || ""}
                  onChange={(e) => {
                    const sheet = userData.spreadsheets.find(
                      (s) => s.spreadsheetId === e.target.value
                    );
                    setSelectedSpreadsheet(sheet);
                  }}
                >
                  {userData.spreadsheets.map((sheet, idx) => (
                    <option key={idx} value={sheet.spreadsheetId}>
                      {sheet.spreadsheetName || sheet.spreadsheetId}
                    </option>
                  ))}
                </Select>
              </Box>
            )}

            {/* File input */}
            <Input
              type="file"
              accept=".pdf,.csv,.xlsx,.xls"
              onChange={handleChange}
              bg="#0B0F1A"
              borderColor="gray.700"
              _hover={{ borderColor: "brand.500" }}
              _focus={{ borderColor: "brand.500" }}
            />

            {!file && (
              <Alert status="info" rounded="lg" bg={"blue.300"}>
                <AlertIcon />
                <Text>Upload one invoice (PDF, CSV, or Excel)</Text>
              </Alert>
            )}

            {file && (
              <Box
                borderWidth="1px"
                borderColor="gray.700"
                bg="#0F1424"
                rounded="xl"
                p={4}
              >
                <Text fontWeight="semibold" mb={2}>
                  Selected File
                </Text>
                <Badge colorScheme="purple">{file.name}</Badge>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSubmit}
            isLoading={loading}
            isDisabled={!file}
          >
            Upload
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UploadInvoiceModal;
