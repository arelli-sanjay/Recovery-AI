const API_BASE_URL = "http://localhost:5000/api";

export const getTransactions = async () => {
  const response = await fetch(
    `${API_BASE_URL}/transactions`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  return response.json();
};