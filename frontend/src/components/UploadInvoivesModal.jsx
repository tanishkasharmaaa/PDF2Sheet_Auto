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
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { CloseIcon } from "@chakra-ui/icons";
import axios from "axios";

const ALLOWED_TYPES = [
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const UploadInvoiceModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState(null);
  const [userData, setUserData] = useState({});
  const toast = useToast();

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setSelectedSpreadsheet(null);
    }

    const storedUserData = JSON.parse(
      localStorage.getItem("usersData") || "{}",
    );
    setUserData(storedUserData);

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
      JSON.stringify([...existing, fingerprint]),
    );
  };

  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const userId = userData.userId;
    if (!userId) {
      toast({
        title: "User not found",
        description: "Please login again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const existingFingerprints = getUploadedFiles();

    const newFiles = selectedFiles.filter((file) => {
      const fingerprint = getFileFingerprint(file, userId);

      if (existingFingerprints.includes(fingerprint)) {
        toast({
          title: "Duplicate file skipped",
          description: `${file.name} already uploaded`,
          status: "warning",
          duration: 2000,
          isClosable: true,
        });
        return false;
      }

      return true;
    });

    if (!newFiles.length) return;

    setFiles((prev) => [...prev, ...newFiles]);

    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!files.length) return;

    if (!selectedSpreadsheet) {
      toast({
        title: "No spreadsheet selected",
        description: "Please select a spreadsheet",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("spreadsheetId", selectedSpreadsheet.spreadsheetId);

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}/email/receive`,
        formData,
        { withCredentials: true },
      );

      files.forEach((file) => {
        const fingerprint = getFileFingerprint(file, userData.userId);
        saveUploadedFile(fingerprint);
      });

      toast({
        title: "Invoices uploaded",
        description: `${files.length} invoice(s) uploaded successfully`,
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
            {subscriptionTier !== "Free" &&
              userData?.spreadsheets?.length > 0 && (
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
                        (s) => s.spreadsheetId === e.target.value,
                      );
                      setSelectedSpreadsheet(sheet);
                    }}
                  >
                    <option style={{ color: "black" }} value="">
                      Select Spreadsheet
                    </option>
                    {userData?.spreadsheets.map((sheet, idx) => (
                      <option
                        style={{ color: "black" }}
                        key={idx}
                        value={sheet.spreadsheetId}
                      >
                        {sheet.spreadsheetName || sheet.spreadsheetId}
                      </option>
                    ))}
                  </Select>
                </Box>
              )}

            <Input
              type="file"
              accept=".pdf,.csv,.xlsx,.xls"
              multiple
              onChange={handleChange}
              bg="#0B0F1A"
              borderColor="gray.700"
              _hover={{ borderColor: "brand.500" }}
              _focus={{ borderColor: "brand.500" }}
            />

            {files?.length > 0 && (
              <Box
                borderWidth="1px"
                borderColor="gray.700"
                bg="#0F1424"
                rounded="xl"
                p={4}
              >
                <Text fontWeight="semibold" mb={2}>
                  Selected Files ({files.length})
                </Text>

                <VStack align="stretch" spacing={2}>
                  {files.map((file, idx) => (
                    <HStack
                      key={idx}
                      bg="#0B0F1A"
                      border="1px solid"
                      borderColor="gray.700"
                      rounded="md"
                      px={2}
                      py={1}
                      justify="space-between"
                    >
                      <HStack>
                        <IconButton
                          size="xs"
                          icon={<CloseIcon />}
                          aria-label="Remove file"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeFile(idx)}
                        />
                        <Text fontSize="sm" color="gray.200">
                          {file.name}
                        </Text>
                      </HStack>

                      <Badge colorScheme="purple">Ready</Badge>
                    </HStack>
                  ))}
                </VStack>
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
            isDisabled={!files.length}
          >
            Upload
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UploadInvoiceModal;
