import {
  Box,
  Heading,
  Text,
  Flex,
  Badge,
  Button,
  VStack,
  Spinner,
  Progress,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Input,
  useDisclosure,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usersInfo, userInvoices } from "../api/dashboardData"; // make sure to create updateSpreadsheetId API
import { addSpreadSheet } from "../api/spreadsheet";

const tierLimits = {
  Free: 20,
  Basic: 200,
  Pro: Infinity,
};

const Profile = () => {
  const [usersData, setUsersData] = useState(null);
  const [listOfInvoices, setListOfInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure(); // For Instructions Modal
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure(); // For Edit Spreadsheet Modal

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const userInfo = await usersInfo();

      if (!userInfo) {
        navigate("/login");
        return;
      }

      setUsersData(userInfo);
      setSpreadsheetIdInput(userInfo?.spreadsheets?.[0]?.spreadsheetId || "");

      const invoicesData = await userInvoices();
      setListOfInvoices(invoicesData?.invoices || []);

      setLoading(false);
    }

    fetchData();
  }, [navigate]);

  const subscriptionTier = usersData?.subscription?.tier || "Free";
  const invoiceLimit = tierLimits[subscriptionTier];
  const invoicesUsed = usersData?.subscription?.invoicesUploaded || 0;

  const { avgConfidence, totalAmount } = useMemo(() => {
    if (listOfInvoices.length === 0)
      return { avgConfidence: 0, totalAmount: 0 };

    const totalConfidence = listOfInvoices.reduce(
      (sum, inv) => sum + (inv.confidenceScore || 0),
      0,
    );
    const totalAmount = listOfInvoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.totalAmount) || 0),
      0,
    );

    return {
      avgConfidence: (totalConfidence / listOfInvoices.length) * 100,
      totalAmount,
    };
  }, [listOfInvoices]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    toast({
      title: "Logged out",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
    navigate("/login");
  };

  const handleSaveSpreadsheet = async () => {
    if (!spreadsheetIdInput) {
      toast({
        title: "Invalid ID",
        description: "Please enter a valid Spreadsheet ID",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Call API to save Spreadsheet ID
      await addSpreadSheet(spreadsheetIdInput);
      toast({
        title: "Spreadsheet Updated",
        description: "Your spreadsheet has been connected successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Update local state
      setUsersData((prev) => ({
        ...prev,
        spreadsheets: [
          {
            spreadsheetId: spreadsheetIdInput,
            connectedAt: new Date().toISOString(),
          },
        ],
      }));

      onEditClose();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update spreadsheet. Try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  const spreadsheet = usersData?.spreadsheets?.[0];

  return (
    <Box px={{ base: 4, md: 8 }} py={8}>
      <Heading size="lg" mb={4}>
        User Profile
      </Heading>

      <VStack spacing={6} align="stretch">
        {/* User Info */}
        <Box
          p={6}
          bg="whiteAlpha.50"
          borderRadius="2xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          <Heading size="md" mb={2}>
            {usersData.name}
          </Heading>
          <Text color="gray.400">Email: {usersData.email}</Text>
          <Badge
            mt={2}
            colorScheme={subscriptionTier === "Free" ? "green" : "blue"}
          >
            {subscriptionTier} Plan
          </Badge>
        </Box>

        {/* Subscription Stats */}
        <Box
          p={6}
          bg="whiteAlpha.50"
          borderRadius="2xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
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

          <Text color="gray.400" mt={4}>
            Average Confidence
          </Text>
          <Heading size="md">{Math.round(avgConfidence)}%</Heading>

          <Text color="gray.400" mt={4}>
            Total Invoice Amount
          </Text>
          <Heading size="md">₹{totalAmount.toLocaleString()}</Heading>
        </Box>

        {/* Spreadsheet Info */}
        <Box
          p={6}
          bg="whiteAlpha.50"
          borderRadius="2xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          <Text color="gray.400" mb={2}>
            Connected Spreadsheet
          </Text>
          {spreadsheet ? (
            <>
              <Text>Spreadsheet ID: {spreadsheet.spreadsheetId}</Text>
              <Text fontSize="sm" color="gray.500">
                Connected At:{" "}
                {new Date(spreadsheet.connectedAt).toLocaleString()}
              </Text>
            </>
          ) : (
            <>
              <Text color="red.400" mb={2}>
                ⚠ You have not connected a spreadsheet. You cannot upload
                invoices without it.
              </Text>
              <Button colorScheme="brand" onClick={onOpen}>
                Show Instructions
              </Button>
            </>
          )}
        </Box>

       
        <Flex gap={4}>
          {!spreadsheet && (
            <Button colorScheme="brand" onClick={onEditOpen}>
              Edit Spreadsheet
            </Button>
          )}
          <Button variant="outline" colorScheme="red" onClick={handleLogout}>
            Logout
          </Button>
        </Flex>
      </VStack>

      {/* Instructions Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>How to Connect Your Spreadsheet</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {/* Add your corrected step-by-step instructions here */}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Spreadsheet Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent
          bg="gray.900"
          borderRadius="2xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          p={6}
        >
          <ModalHeader color="brand.500" fontSize="xl" fontWeight="bold">
            Edit Spreadsheet
          </ModalHeader>
          <ModalCloseButton color="gray.300" />
          <ModalBody>
            <VStack align="start" spacing={4}>
              <Text color="gray.400">
                Enter your Google Spreadsheet ID below:
              </Text>
              <Input
                placeholder="Spreadsheet ID"
                value={spreadsheetIdInput}
                onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.300"
                borderRadius="xl"
                color="white"
                _placeholder={{ color: "gray.500" }}
                _focus={{
                  borderColor: "brand.500",
                  boxShadow: "0 0 0 1px #5e81f4",
                }}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="brand"
              mr={3}
              onClick={handleSaveSpreadsheet}
              _hover={{ bg: "brand.600" }}
            >
              Save
            </Button>
            <Button
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              _hover={{ bg: "whiteAlpha.100" }}
              onClick={onEditClose}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Profile;
