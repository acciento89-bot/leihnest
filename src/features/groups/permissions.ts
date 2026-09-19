export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

const isManager = (role: GroupRole) => role === "OWNER" || role === "ADMIN";

export const canManageInventory = isManager;
export const canManageReservations = isManager;
export const canInvite = isManager;
export const canManageGroupImage = isManager;
export const canManageBilling = (role: GroupRole) => role === "OWNER";
