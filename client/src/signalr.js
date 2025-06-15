import * as signalR from "@microsoft/signalr";

let connection;
const apiUrl = process.env.REACT_APP_API_URL;

export const startSignalRConnection = async (token, handlers) => {
  console.log("Starting SignalR connection to:", `${apiUrl}/taskhub`);
  console.log("Token:", token);

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${apiUrl}/taskhub`, {
      accessTokenFactory: () => token,
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .build();

  // ✅ Dynamic registration of handlers
  if (handlers && typeof handlers === "object") {
    Object.entries(handlers).forEach(([eventName, handler]) => {
      connection.on(eventName, handler);
    });
  }

  // ✅ Fallback logging to catch if the main handlers don't trigger
  connection.on("NewTaskAssigned", (data) => {
    console.log("🚨 [Fallback] Received NewTaskAssigned (raw):", data);
  });

  try {
    await connection.start();
    console.log("SignalR connected.");
    return connection;
  } catch (err) {
    console.error("SignalR connection error:", err);
  }
};


export const stopSignalRConnection = () => {
  if (connection) connection.stop();
};
