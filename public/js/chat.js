const socket = io();

// Elements
const $messageForm = document.querySelector("#user-message");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationUrlTemplate = document.querySelector("#location-url-template")
  .innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled down
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

// Message handler
socket.on("message", (incomingMessage) => {
  console.log(incomingMessage);
  const html = Mustache.render(messageTemplate, {
    username: incomingMessage.username,
    message: incomingMessage.text,
    createdAt: moment(incomingMessage.createdAt).format("ddd, h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

// Location handler
socket.on("locationMessage", (locationMessageUrl) => {
  console.log(locationMessageUrl);
  const html = Mustache.render(locationUrlTemplate, {
    username: locationMessageUrl.username,
    locationUrl: locationMessageUrl,
    createdAt: moment(locationMessageUrl.createdAt).format("ddd, h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

// Update room user list
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

// Send message
$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  // Disable button when message is fired off
  const userMessage = e.target.elements.message.value;

  socket.emit("outgoingMessage", userMessage, (error) => {
    // Enable button after message was successfully sent to server and reset inpurt field
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log("Message delivered.");
  });
});

// Send location
$locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browswer.");
  }

  // Disable send location button while retrieving location data
  $locationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        // Enable locaiton button once location data has successfully been sent to server
        $locationButton.removeAttribute("disabled");
        console.log("Location shared.");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
