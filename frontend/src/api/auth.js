const BASE_URL = import.meta.env.VITE_BACKEND_URI;

/* ================= SIGNUP ================= */
export async function signup(name, email, password) {
  try {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Signup failed");
    }

    return data;
  } catch (error) {
    console.error("Signup Error:", error.message);
    return null;
  }
}

/* ================= LOGIN ================= */
export async function loginUser(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // for cookies (refresh token)
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (data?.user?.token) {
      localStorage.setItem("accessToken", JSON.stringify(data?.user?.token));
    }

    return data;
  } catch (error) {
    console.error("Login Error:", error.message);
    return null;
  }
}
