import React from "react";
import HelloWorld from "./App";
import ReactDOM from "react-dom";

ReactDOM.render(
  <React.StrictMode>
    <HelloWorld />
  </React.StrictMode>,
  document.getElementById("container")
);

// document.addEventListener("DOMContentLoaded", function () {
//   const container = document.getElementById(
//     "container"
//   ) as HTMLDivElement | null;

//   const changeButtonStyle = (active: boolean) => {
//     if (!container) return;
//     if (active) {
//       container.classList.add("active");
//       container.innerText = "GOOD";
//     } else {
//       container.classList.remove("active");
//       container.innerText = "I AM PROCRASTINATING";
//     }
//   };

//   chrome.runtime.sendMessage(
//     { type: "GET_STATUS" } as Message,
//     function (response) {
//       changeButtonStyle(response.data.active);
//     }
//   );

//   container?.addEventListener("click", function () {
//     chrome.runtime.sendMessage(
//       { type: "TOGGLE_STATUS" } as Message,
//       function (response) {
//         changeButtonStyle(response.data.active);
//       }
//     );
//   });

//   ReactDOM.render(<HelloWorld />, container);
// });
