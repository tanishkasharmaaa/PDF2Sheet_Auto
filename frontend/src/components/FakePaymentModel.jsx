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
  VStack,
  Text,
  Box,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import axios from "axios";

const FakePaymentModal = ({ isOpen, onClose, plan }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handlePayment = async () => {
    try {
      setLoading(true);

      // fake delay like Stripe
      await new Promise((res) => setTimeout(res, 1500));

      // 🔥 call your existing upgrade route
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}/users/upgrade-subscription`,
        { tier: plan.name },
        { withCredentials: true }
      );

      toast({
        title: "Payment successful 🎉",
        description: `Upgraded to ${plan.name} plan`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (err) {
      toast({
        title: "Payment failed",
        description: "Something went wrong",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="#11162A" borderRadius="2xl">
        <ModalHeader>Complete Payment</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box
              bg="#0B0F1A"
              p={4}
              rounded="xl"
              border="1px solid"
              borderColor="gray.700"
            >
              <Text fontWeight="bold">{plan.name} Plan</Text>
              <Text color="gray.400">{plan.price} / month</Text>
            </Box>

            <Input placeholder="Card Number" value="4242 4242 4242 4242" />
            <Input placeholder="Expiry (MM/YY)" value="12/28" />
            <Input placeholder="CVV" value="123" />
            <Input placeholder="Name on Card" value="Tanishka" />

            <Text fontSize="xs" color="gray.400">
              ⚠ Demo payment — no real charges applied
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            onClick={handlePayment}
            isLoading={loading}
          >
            Pay {plan.price}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FakePaymentModal;
