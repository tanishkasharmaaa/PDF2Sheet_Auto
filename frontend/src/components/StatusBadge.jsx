import { Badge } from "@chakra-ui/react";

export const StatusBadge = ({ status }) => (
  <Badge
    colorScheme={
      status === "AUTO_PROCESSED"
        ? "green"
        : status === "NEEDS_REVIEW"
        ? "yellow"
        : "blue"
    }
    textTransform="capitalize"
  >
    {status.replace("_", " ").toLowerCase()}
  </Badge>
);
