import axios from "axios";

const API_URL = "http://localhost:5000/api/dashboard";

export const getDashboardSummary = async () => {
  const response = await axios.get(`${API_URL}/summary`);
  return response.data;
};