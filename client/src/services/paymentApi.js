const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getTransactions = async () => {
  const response = await fetch(
    `${API_BASE_URL}/transactions`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  return response.json();
};
