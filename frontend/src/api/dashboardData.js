const BACKEND_URL = import.meta.env.VITE_BACKEND_URI;

export async function usersInfo() {
  try {
    const res = await fetch(`${BACKEND_URL}/users/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Handle unauthorized / error responses
    if (!res.ok) {
      throw new Error("Unauthorized or failed to fetch user info");
    }

    const data = await res.json();
    localStorage.setItem("usersData",JSON.stringify(data))
    return data;
  } catch (error) {
    console.error("usersInfo error:", error.message);
    return null;
  }
}

export async function userInvoices () {
    try {
        const res = await fetch(`${BACKEND_URL}/invoices/`,{
            method:"GET",
            credentials:"include"
        })
        const data = res.json();
        return data
    } catch (error) {
        console.log(error)
    }
}

export async function getInvoiceByInvoiceId (invoiceId) {
    try {
        const res = await fetch(`${BACKEND_URL}/invoices/${invoiceId}`,{
            method:"GET",
            credentials:"include"
        })
        const data = await res.json()
        console.log(data.data)
        return data.data
    } catch (error) {
        console.log(error)
    }
}

export async function uploadInvoices(files, spreadsheetId) {
  try {
    if (!files || files.length === 0) {
      throw new Error("No files selected");
    }

    if (!spreadsheetId) {
      throw new Error("Spreadsheet ID is required");
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("invoices", file));

    // Append the selected spreadsheetId
    formData.append("spreadsheetId", spreadsheetId);

    console.log("Uploading files:", files, "to spreadsheet:", spreadsheetId);

    const res = await fetch(`${BACKEND_URL}/email/receive`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Invoice upload failed");
    }

    return data;
  } catch (error) {
    console.error("uploadInvoices error:", error.message);
    throw error;
  }
}