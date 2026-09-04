import api from "./api";

// GET ALL ESCALATIONS
export const getEscalations = async () => {
  const response = await api.get("/escalations");

  return response.data;
};

// GET ESCALATION BY ID
export const getEscalationById = async (id) => {
  const response = await api.get(`/escalations/${id}`);

  return response.data;
};

// APPROVE ESCALATION
export const approveEscalation = async (id) => {
  const response = await api.post(`/escalations/${id}/approve`);

  return response.data;
};

// REJECT ESCALATION
export const rejectEscalation = async (id, reason) => {
  const response = await api.post(`/escalations/${id}/reject`, {
    reason,
  });

  return response.data;
};