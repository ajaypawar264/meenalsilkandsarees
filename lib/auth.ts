export const registerUser = async () => {
  throw new Error("Firebase auth not enabled");
};

export const loginUser = async () => {
  throw new Error("Firebase auth not enabled");
};

export const logoutUser = async () => {
  try {
    localStorage.removeItem("user_mobile");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_id");
  } catch (error) {
    console.error("Logout error:", error);
  }
};