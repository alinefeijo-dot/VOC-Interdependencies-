import { useEffect, useRef } from "react";

export function useBoardSocket(onBoard) {
  const onBoardRef = useRef(onBoard);
  onBoardRef.current = onBoard;

  useEffect(() => {
    let socket;
    let closedByUs = false;
    let retryTimer;

    function connect() {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      socket = new WebSocket(`${proto}://${window.location.host}/ws`);
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "board") onBoardRef.current(msg.data);
      };
      socket.onclose = () => {
        if (!closedByUs) retryTimer = setTimeout(connect, 1500);
      };
    }

    connect();
    return () => {
      closedByUs = true;
      clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);
}
