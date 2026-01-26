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
  Select,
  useDisclosure,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usersInfo, userInvoices } from "../api/dashboardData";
import {
  addSpreadSheet,
  updateSpreadsheet,
  deleteSpreadsheet,
} from "../api/spreadsheet";
import SpreadsheetHelpModal from "../components/SpreadsheetHelpModal";
import { Navbar } from "../components/Navbar";

const tierLimits = {
  Free: 20,
  Basic: 200,
  Pro: Infinity,
};
const spreadsheetLimits = {
  Free: 1,
  Basic: 3,
  Pro: Infinity,
};

const Profile = () => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [usersData, setUsersData] = useState(null);
  const [listOfInvoices, setListOfInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState("");
  const [spreadsheetNameInput, setSpreadsheetNameInput] = useState("");
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0); // for Pro plan
  const navigate = useNavigate();
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure(); // Instructions Modal
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const userInfo = await usersInfo();
      if (!userInfo) {
        navigate("/login");
        return;
      }

      setUsersData(userInfo);

      const firstSheet = userInfo?.spreadsheets?.[0];
      setSpreadsheetIdInput(firstSheet?.spreadsheetId || "");
      setSpreadsheetNameInput(firstSheet?.name || "");
      setSelectedSheetIndex(0);

      const invoicesData = await userInvoices();
      setListOfInvoices(invoicesData?.invoices || []);
      setLoading(false);
    }
    fetchData();
  }, [navigate]);

  const subscriptionTier = usersData?.subscription?.tier || "Free";
  const invoiceLimit = tierLimits[subscriptionTier];
  const invoicesUsed = usersData?.subscription?.invoicesUploaded || 0;

  const spreadsheetLimit = spreadsheetLimits[subscriptionTier];
  const spreadsheetsUsed = usersData?.spreadsheets?.length || 0;

  const canAddMoreSpreadsheets = spreadsheetsUsed < spreadsheetLimit;

  const { avgConfidence, totalAmount } = useMemo(() => {
    if (!listOfInvoices.length) return { avgConfidence: 0, totalAmount: 0 };
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
    const isEditing = !isAddMode;
    console.log(isEditing);
    if (!isEditing && !canAddMoreSpreadsheets) {
      toast({
        title: "Spreadsheet limit reached",
        description:
          subscriptionTier === "Free"
            ? "Upgrade your plan to add more spreadsheets"
            : "You have reached your spreadsheet limit",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!spreadsheetIdInput || !spreadsheetNameInput) {
      toast({
        title: "Invalid Input",
        description: "Please enter both Spreadsheet ID and Name",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      let data;

      if (isEditing) {
        data = await updateSpreadsheet(
          selectedSheetIndex,
          spreadsheetIdInput,
          spreadsheetNameInput,
        );
      } else {
        data = await addSpreadSheet(spreadsheetIdInput, spreadsheetNameInput);
      }

      toast({
        title: isEditing ? "Spreadsheet Updated" : "Spreadsheet Added",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setUsersData((prev) => ({
        ...prev,
        spreadsheets: data.spreadsheets,
      }));

      onEditClose();
      navigate("/login");
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to save spreadsheet",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteSpreadsheet = async () => {
    try {
      const data = await deleteSpreadsheet(selectedSheetIndex);

      toast({
        title: "Spreadsheet deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setUsersData((prev) => ({
        ...prev,
        spreadsheets: data.spreadsheets,
      }));

      setSelectedSheetIndex(0);
      setSpreadsheetIdInput("");
      setSpreadsheetNameInput("");
      navigate("/login");
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err.message,
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

  return (
    <>
      <Navbar />
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
              Connected Spreadsheets
            </Text>

            {usersData?.spreadsheets?.length > 0 ? (
              subscriptionTier !== "Free" ? (
                <>
                  {/* Select existing spreadsheet */}
                  <Select
                    mb={2}
                    bgColor={"black"}
                    value={selectedSheetIndex ?? ""}
                    onChange={(e) => {
                      const idx =
                        e.target.value === "" ? null : parseInt(e.target.value);
                      setSelectedSheetIndex(idx);
                      setIsAddMode(idx === null);
                      if (idx !== null) {
                        setSpreadsheetIdInput(
                          usersData.spreadsheets[idx].spreadsheetId,
                        );
                        setSpreadsheetNameInput(
                          usersData.spreadsheets[idx].spreadsheetName || "",
                        );
                      } else {
                        setSpreadsheetIdInput("");
                        setSpreadsheetNameInput("");
                      }
                    }}
                  >
                    <option value="" style={{ color: "black" }}>
                      SELECT SPREADSHEET
                    </option>
                    {usersData.spreadsheets.map((sheet, idx) => (
                      <option key={idx} value={idx} style={{ color: "black" }}>
                        {sheet.spreadsheetName || sheet.spreadsheetId}{" "}
                        (Connected at{" "}
                        {new Date(sheet.connectedAt).toLocaleString()})
                      </option>
                    ))}
                  </Select>

                  <Flex
                    gap={2}
                    mt={2}
                    direction={{ base: "column", md: "row" }}
                  >
                    <Button
                      colorScheme="brand"
                      width={{ base: "100%", md: "auto" }}
                      onClick={() => {
                        if (selectedSheetIndex === null) {
                          toast({
                            title: "No spreadsheet selected",
                            description: "Please select a spreadsheet to edit",
                            status: "warning",
                            duration: 3000,
                            isClosable: true,
                          });
                          return;
                        }
                        setIsAddMode(false);
                        onEditOpen();
                      }}
                    >
                      Edit Selected Spreadsheet
                    </Button>

                    <Button
                      colorScheme="brand"
                      width={{ base: "100%", md: "auto" }}
                      isDisabled={!canAddMoreSpreadsheets}
                      onClick={() => {
                        setIsAddMode(true);
                        setSelectedSheetIndex(null);
                        setSpreadsheetIdInput("");
                        setSpreadsheetNameInput("");
                        onEditOpen();
                      }}
                    >
                      Add New Spreadsheet
                    </Button>

                    <Button
                      colorScheme="red"
                      width={{ base: "100%", md: "auto" }}
                      onClick={handleDeleteSpreadsheet}
                      isDisabled={!usersData?.spreadsheets?.length}
                    >
                      Delete Selected Spreadsheet
                    </Button>
                  </Flex>
                </>
              ) : (
                // Free plan: show single spreadsheet
                <>
                  <Text>
                    Spreadsheet Name:{" "}
                    {usersData.spreadsheets[0].spreadsheetName || "Unnamed"}
                  </Text>
                  <Text>
                    Spreadsheet ID: {usersData.spreadsheets[0].spreadsheetId}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Connected At:{" "}
                    {new Date(
                      usersData.spreadsheets[0].connectedAt,
                    ).toLocaleString()}
                  </Text>
                  <Button
                    colorScheme="brand"
                    mt={2}
                    onClick={() => {
                      setIsAddMode(false); // Edit mode
                      setSelectedSheetIndex(0);
                      setSpreadsheetIdInput(
                        usersData.spreadsheets[0].spreadsheetId,
                      );
                      setSpreadsheetNameInput(
                        usersData.spreadsheets[0].spreadsheetName || "",
                      );
                      onEditOpen();
                    }}
                  >
                    Edit Spreadsheet
                  </Button>
                </>
              )
            ) : (
              // No spreadsheet connected
              <>
                <Text color="red.400" mb={2}>
                  ⚠ You have not connected a spreadsheet. You cannot upload
                  invoices without it.
                </Text>
                <Button colorScheme="brand" onClick={onOpen}>
                  Show Instructions
                </Button>
                <Button
                  colorScheme="brand"
                  ml={2}
                  isDisabled={!canAddMoreSpreadsheets}
                  onClick={() => {
                    setIsAddMode(true); // Add mode
                    setSelectedSheetIndex(null);
                    setSpreadsheetIdInput("");
                    setSpreadsheetNameInput("");
                    onEditOpen();
                  }}
                >
                  Add New Spreadsheet
                </Button>
              </>
            )}
          </Box>

          <Flex gap={4}>
            <Button variant="outline" colorScheme="red" onClick={handleLogout}>
              Logout
            </Button>
          </Flex>
        </VStack>

        {/* Instructions Modal */}
        <SpreadsheetHelpModal isOpen={isOpen} onClose={onClose} />

        {/* Edit/Add Spreadsheet Modal */}
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
              {isAddMode ? "Add Spreadsheet" : "Edit Spreadsheet"}
            </ModalHeader>
            <ModalCloseButton color="gray.300" />
            <ModalBody>
              <VStack align="start" spacing={4}>
                <Text color="gray.400">Enter your Google Spreadsheet ID:</Text>
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
                <Text color="gray.400">Give this spreadsheet a name:</Text>
                <Input
                  placeholder="Spreadsheet Name"
                  value={spreadsheetNameInput}
                  onChange={(e) => setSpreadsheetNameInput(e.target.value)}
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
                <Text fontSize="sm" color="gray.500">
                  Free: 1 spreadsheet | Basic: 3 spreadsheets | Pro: Unlimited
                </Text>
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
    </>
  );
};

export default Profile;
