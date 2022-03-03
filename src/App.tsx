import React, { useCallback, useEffect, useState } from "react";
import { Message } from "./background";
import TimeAgo from "react-timeago";

const HelloWorld = () => {
  const [active, setActive] = useState<boolean>();
  const [procrastinatingSince, setProcrastinatingSince] = useState<number>();

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: "GET_STATUS" } as Message,
      function (response: Message) {
        setActive(response.data?.active as boolean);
        setProcrastinatingSince(
          response.data?.procrastinatingSince as number | undefined
        );
      }
    );
  }, []);

  const toggleActive = useCallback(() => {
    chrome.runtime.sendMessage(
      { type: "TOGGLE_STATUS" } as Message,
      function (response: Message) {
        setActive(response.data?.active);
        setProcrastinatingSince(
          response.data?.procrastinatingSince as number | undefined
        );
      }
    );
  }, []);

  return (
    <div id="app" className={active ? "active" : ""} onClick={toggleActive}>
      <h1>{active ? "DOING WORK" : "PROCRASTINATING..."}</h1>
      {procrastinatingSince && (
        <h2>
          <TimeAgo date={procrastinatingSince} />
        </h2>
      )}
    </div>
  );
};

export default HelloWorld;
