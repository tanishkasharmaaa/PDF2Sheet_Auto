import { Progress,Flex,Text } from "@chakra-ui/react";

export const ConfidenceBar = ({ score }) => {
  if (!score) {
    return <Text fontSize="sm" color="gray.500">—</Text>;
  }

  return (
    <Flex align="center" gap={2}>
      <Progress
        value={score * 100}
        size="sm"
        w="80px"
        borderRadius="full"
        colorScheme={
          score > 0.8 ? "green" : score > 0.6 ? "yellow" : "red"
        }
      />
      <Text fontSize="xs">{Math.round(score * 100)}%</Text>
    </Flex>
  );
};
