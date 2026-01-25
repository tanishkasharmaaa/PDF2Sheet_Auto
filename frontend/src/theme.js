import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: "#0B0F1A",
        color: "gray.100",
      },
    },
  },
  colors: {
    brand: {
      50: "#e3f2ff",
      100: "#b3d4ff",
      500: "#4F46E5", // Indigo
      600: "#4338CA",
      700: "#3730A3",
    },
  },
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: "xl",
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: "lg",
        },
      },
    },
  },
});

export default theme;
