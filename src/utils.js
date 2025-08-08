const url = /*"https://poto-back.inf.santiago.usm.cl"*/ "http://localhost:4000";
export default url;

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(`${url}${endpoint}`, config);

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.reload();
      return
    }
    return await response.json();
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}