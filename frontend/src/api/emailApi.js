import axios from "axios";

export const uploadMultipleInvoices = async (files) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("invoices", file);
  });

  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/email/receive-multiple`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};
