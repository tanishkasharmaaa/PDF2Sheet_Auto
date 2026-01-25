import { Box, Flex } from "@chakra-ui/react";

const AuthLayout = ({ children }) => {
  return (
    <Flex
      minH="calc(100vh - 72px)"
      align="center"
      justify="center"
      bgGradient="radial(circle at top, #1a1f36, #0b0f1a)"
    >
      <Box
        w="100%"
        maxW="420px"
        p={8}
        bg="whiteAlpha.50"
        border="1px solid"
        borderColor="whiteAlpha.200"
        borderRadius="2xl"
        boxShadow="0 20px 40px rgba(0,0,0,0.4)"
      >
        {children}
      </Box>
    </Flex>
  );
};

export default AuthLayout;
