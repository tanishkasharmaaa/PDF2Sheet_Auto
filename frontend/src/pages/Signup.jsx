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
import { signup } from "../api/auth";
import { useState } from "react";
import { Navbar } from "../components/Navbar";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      toast({
        title: "All fields are required",
        status: "warning",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Minimum 8 characters required",
        status: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await signup(name, email, password);

      if (!res || res.error) {
        throw new Error(res?.message || "Signup failed");
      }

      toast({
        title: "Account created 🎉",
        description: "Please login to continue",
        status: "success",
      });

      navigate("/login");
    } catch (err) {
      toast({
        title: "Signup failed",
        description: err.message || "Something went wrong",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (<>
  <Navbar/>
    <AuthLayout>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Create your account 🚀</Heading>
        <Text color="gray.400">
          Start automating invoice entry in seconds
        </Text>

        <VStack spacing={4}>
          <Input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
          loadingText="Creating account"
        >
          Create Account
        </Button>

        <Divider />

        <Text fontSize="sm" color="gray.400" textAlign="center">
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#4F46E5" }}>
            Login
          </Link>
        </Text>
      </VStack>
    </AuthLayout>
  </>);
};

export default Signup;
