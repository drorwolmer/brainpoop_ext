var containerDiv = document.createElement("div");
containerDiv.style.cssText = `
display:none;
position:fixed;
width:100px;
height:50px;
background-color:green;
left:10px;
top:10px;
z-index:9999;
border-radius:5px;
font-size:15px;
display:flex;
align-items:center;
justify-content:center;
cursor:pointer;
color:black;
`;
containerDiv.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "TOGGLE_STATUS" }, () => {
    //   Change window location
    window.location.href = "https://wallpaperaccess.com/full/3821307.jpg";
  });
});
document.body.prepend(containerDiv);

const fetchState = () => {
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, function (response) {
    console.log(response);
    if (!response.data.active) {
      const procrastinatingSinceSeconds: number | undefined =
        response.data.procrastinatingSinceSeconds;
      if (procrastinatingSinceSeconds) {
        const procrastinatingSinceMinutes = Math.floor(
          procrastinatingSinceSeconds / 60
        );

        containerDiv.style.display = "flex";
        containerDiv.style.backgroundColor = "red";

        containerDiv.innerText = `${procrastinatingSinceMinutes} Minutes`;

        containerDiv.style.width = `${
          Math.floor(procrastinatingSinceSeconds) + 100
        }px`;
        containerDiv.style.height = `${
          Math.floor(procrastinatingSinceSeconds) + 50
        }px`;
      }
    } else {
      containerDiv.style.backgroundColor = "green";
      containerDiv.style.display = "none";
    }
  });
};

fetchState();
setInterval(fetchState, 1000);
