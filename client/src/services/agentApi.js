import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// GET ALL AGENT CASES
export const getAgentCases = async () => {
  const response = await axios.get(`${API_URL}/recovery/cases`);

  return response.data;
};

// GET SINGLE CASE
export const getAgentCase = async (caseId) => {
  const response = await axios.get(
    `${API_URL}/recovery/cases/${caseId}`
  );

  return response.data;
};

// ANALYZE CASE WITH AI
export const analyzeAgentCase = async (caseId) => {
  const response = await axios.post(
    `${API_URL}/agent/analyze/${caseId}`
  );

  return response.data;
};

// EXECUTE RECOVERY
export const executeAgentRecovery = async (caseId) => {
  const response = await axios.post(
    `${API_URL}/recovery/${caseId}/execute`
  );

  return response.data;
};
