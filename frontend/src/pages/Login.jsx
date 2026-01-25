import {
  Heading,
  Text,
  VStack,
  Input,
  Button,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { loginUser } from "../api/auth";
import { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email || !password) {
      toast({
        title: "All fields are required",
        status: "warning",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Invalid password",
        description: "Minimum 8 characters required",
        status: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await loginUser(email, password);

      if (!res || res.error) {
        throw new Error(res?.message || "Login failed");
      }

      toast({
        title: "Login successful 🎉",
        description: "Redirecting to dashboard",
        status: "success",
      });

      navigate("/dashboard");
    } catch (err) {
      toast({
        title: "Login failed",
        description: err.message || "Invalid credentials",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Welcome back 👋</Heading>
        <Text color="gray.400">
          Login to continue managing your invoices
        </Text>

        <VStack spacing={4}>
          <Input
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </VStack>

        <Button
          colorScheme="brand"
          size="lg"
          onClick={handleSubmit}
          isLoading={loading}
          loadingText="Logging in"
        >
          Login
        </Button>

        <Divider />

        <Text fontSize="sm" color="gray.400" textAlign="center">
          Don’t have an account?{" "}
          <Link to="/signup" style={{ color: "#4F46E5" }}>
            Sign up
          </Link>
        </Text>
      </VStack>
    </AuthLayout>
  );
};

export default Login;
