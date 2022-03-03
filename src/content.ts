var containerDiv = document.createElement("div");
containerDiv.style.cssText = `
display:none;
position:fixed;
width:50px;
height:50px;
background-color:red;
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
containerDiv.innerHTML = "test";
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
      containerDiv.style.display = "flex";
      containerDiv.innerText = `${Math.floor(
        response.data.procrastinatingSinceSeconds
      )}`;
    } else {
      containerDiv.style.display = "none";
    }
  });
};

fetchState();
setInterval(fetchState, 1000);
