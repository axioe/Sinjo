import { request } from "./client";

export const getAdminProposals = async () =>
  request("/api/admin/proposals", { method: "GET" });

export const getAdminProposal = async (proposalId) =>
  request(`/api/admin/proposals/${proposalId}`, { method: "GET" });

export const updateAdminProposal = async (proposalId, data) =>
  request(`/api/admin/proposals/${proposalId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const executeProposalAiReview = async (proposalId) =>
  request(`/api/admin/proposals/${proposalId}/ai-review`, {
    method: "POST",
  });

export const approveProposal = async (proposalId, data) =>
  request(`/api/admin/proposals/${proposalId}/approve`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const rejectProposal = async (proposalId, reason = "") =>
  request(`/api/admin/proposals/${proposalId}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason: reason.trim() || null }),
  });
