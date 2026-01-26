import {
  Flex,
  Heading,
  Button,
  HStack,
  Spacer,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

export const Navbar = () => {
  const navigate = useNavigate();
  const isAuth = localStorage.getItem("accessToken");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    onClose();
    navigate("/login");
    window.location.reload()
  };

  return (
    <>
      {/* NAVBAR */}
      <Flex
        position="sticky"
        top="0"
        zIndex="100"
        px={{ base: 4, md: 8 }}
        py={4}
        align="center"
        bg="rgba(11,15,26,0.85)" // theme background
        backdropFilter="blur(14px)"
        borderBottom="1px solid"
        borderColor="whiteAlpha.200"
      >
        {/* Logo */}
        <Heading
          as={Link}
          to="/"
          size="md"
          color="brand.500" // theme brand color
          letterSpacing="wide"
          _hover={{ textDecoration: "none", opacity: 0.9 }}
        >
          PDF2Sheet Auto
        </Heading>

        <Spacer />

        {/* DESKTOP NAV */}
        <HStack spacing={3} display={{ base: "none", md: "flex" }}>
          {!isAuth ? (
            <>
              <Button
                as={Link}
                to="/login"
                variant="ghost"
                color="gray.300"
                _hover={{ color: "gray.100", bg: "whiteAlpha.100" }}
              >
                Login
              </Button>
              <Button
                as={Link}
                to="/signup"
                colorScheme="brand"
                _hover={{ opacity: 0.9 }}
              >
                Get Started
              </Button>
            </>
          ) : (
            <>
              <Button
                as={Link}
                to="/dashboard"
                variant="ghost"
                color="gray.300"
                _hover={{ color: "gray.100", bg: "whiteAlpha.100" }}
              >
                Dashboard
              </Button>
              <Button
                as={Link}
                to="/invoices"
                variant="ghost"
                color="gray.300"
                _hover={{ color: "gray.100", bg: "whiteAlpha.100" }}
              >
                Invoices
              </Button>
              <Button
                as={Link}
                to="/profile"
                variant="ghost"
                color="gray.300"
                _hover={{ color: "gray.100", bg: "whiteAlpha.100" }}
              >
                Profile
              </Button>
               <Button
                    as={Link}
                    to="/pricing"
                    variant="ghost"
                    color="gray.300"
                    _hover={{ bg: "whiteAlpha.100", color: "gray.100" }}
                    onClick={onClose}
                  >
                    Pricing
                  </Button>
              <Button
                variant="outline"
                borderColor="red.400"
                color="red.300"
                _hover={{
                  bg: "red.500",
                  color: "white",
                  borderColor: "red.500",
                }}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          )}
        </HStack>

        {/* MOBILE MENU BUTTON */}
        <IconButton
          aria-label="Open menu"
          icon={<FiMenu />}
          variant="ghost"
          color="gray.200"
          display={{ base: "flex", md: "none" }}
          onClick={onOpen}
          _hover={{ bg: "whiteAlpha.100" }}
        />
      </Flex>

      {/* MOBILE DRAWER */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="#0B0F1A">
          <DrawerCloseButton color="gray.300" />
          <DrawerHeader color="brand.500">PDF2Sheet Auto</DrawerHeader>

          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {!isAuth ? (
                <>
                  <Button
                    as={Link}
                    to="/login"
                    colorScheme="brand"
                    variant="ghost"
                    _hover={{ bg: "whiteAlpha.100" }}
                    onClick={onClose}
                  >
                    Login
                  </Button>
                  <Button
                    as={Link}
                    to="/signup"
                    colorScheme="brand"
                    onClick={onClose}
                  >
                    Get Started
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    as={Link}
                    to="/dashboard"
                    variant="ghost"
                    color="gray.300"
                    _hover={{ bg: "whiteAlpha.100", color: "gray.100" }}
                    onClick={onClose}
                  >
                    Dashboard
                  </Button>
                  <Button
                    as={Link}
                    to="/invoices"
                    variant="ghost"
                    color="gray.300"
                    _hover={{ bg: "whiteAlpha.100", color: "gray.100" }}
                    onClick={onClose}
                  >
                    Invoices
                  </Button>
                  <Button
                    as={Link}
                    to="/profile"
                    variant="ghost"
                    color="gray.300"
                    _hover={{ bg: "whiteAlpha.100", color: "gray.100" }}
                    onClick={onClose}
                  >
                    Profile
                  </Button>
                   <Button
                    as={Link}
                    to="/pricing"
                    variant="ghost"
                    color="gray.300"
                    _hover={{ bg: "whiteAlpha.100", color: "gray.100" }}
                    onClick={onClose}
                  >
                    Pricing
                  </Button>
                  <Button
                    variant="outline"
                    borderColor="red.400"
                    color="red.300"
                    _hover={{
                      bg: "red.500",
                      color: "white",
                      borderColor: "red.500",
                    }}
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};
