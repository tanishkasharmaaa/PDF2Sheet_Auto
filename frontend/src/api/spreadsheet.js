const BACKEND_URL = import.meta.env.VITE_BACKEND_URI;


export async function addSpreadSheet(spreadsheetId, name, index = null) {
  if (!spreadsheetId || !name) {
    throw new Error("Spreadsheet ID and name are required");
  }

  try {
    const res = await fetch(`${BACKEND_URL}/users/add-spreadsheet`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        spreadsheetId,
        name,
        index, // 👈 null = add new, number = edit existing
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to add spreadsheet");
    }

    return data;
  } catch (error) {
    console.error("Error adding spreadsheet:", error);
    throw error;
  }
}

export async function updateSpreadsheet(index, spreadsheetId, name) {
  if (index === null || index === undefined) {
    throw new Error("Spreadsheet index is required");
  }

  if (!spreadsheetId || !name) {
    throw new Error("Spreadsheet ID and name are required");
  }

  try {
    const res = await fetch(`${BACKEND_URL}/users/spreadsheet`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        index,
        spreadsheetId,
        name,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update spreadsheet");
    }

    return data;
  } catch (error) {
    console.error("Error updating spreadsheet:", error);
    throw error;
  }
}
