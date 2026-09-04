const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getRecoveryCases = async () => {
  const response = await fetch(
    `${API_BASE_URL}/recovery/cases`
  );

  if (!response.ok) {
    throw new Error("Failed to load recovery cases");
  }

  return response.json();
};

export const getRecoveryCaseById = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/recovery/cases/${id}`
  );

  if (!response.ok) {
    throw new Error("Failed to load recovery case");
  }

  return response.json();
};

export const executeRecovery = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/recovery/${id}/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || "Recovery execution failed"
    );
  }

  return response.json();
};
