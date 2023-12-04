const recordBtn = document.querySelector(".record"),
  result = document.querySelector(".result"),
  downloadBtn = document.querySelector(".download"),
  clearBtn = document.querySelector(".clear"),
  wiki = document.querySelector(".wiki"),
  correct = document.querySelector(".correct"),
  texts = document.querySelector(".texts");

let SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition,
  recognition,
  recording = false,
  correct_title = "";

function changeColor(c) {
  correct.style.color = c;
  return false;
}

function speechToText() {
  try {
    recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recordBtn.classList.add("recording");
    recordBtn.querySelector("p").innerHTML = "Listening...";
    recognition.start();
    recognition.onresult = (event) => {
      downloadBtn.disabled = true;
      const speechResult = event.results[0][0].transcript;
      //detect when intrim results
      if (event.results[0].isFinal) {
        result.innerHTML += " " + speechResult;
        result.querySelector("p").remove();
        downloadBtn.disabled = false;
      } else {
        //creative p with class interim if not already there
        if (!document.querySelector(".interim")) {
          const interim = document.createElement("p");
          interim.classList.add("interim");
          result.appendChild(interim);
        }
        //update the interim p with the speech result
        document.querySelector(".interim").innerHTML = " " + speechResult;
      }
      clearBtn.disabled = false;
    };

    recognition.onspeechend = () => {
      speechToText();
    };
    recognition.onerror = (event) => {
      stopRecording();
      if (event.error === "no-speech") {
        alert("No speech was detected. Stopping...");
      } else if (event.error === "audio-capture") {
        alert(
          "No microphone was found. Ensure that a microphone is installed."
        );
      } else if (event.error === "not-allowed") {
        alert("Permission to use microphone is blocked.");
      } else if (event.error === "aborted") {
        alert("Listening Stopped.");
      } else {
        alert("Error occurred in recognition: " + event.error);
      }
    };
  } catch (error) {
    recording = false;

    console.log(error);
  }
}

recordBtn.addEventListener("click", () => {
  if (!recording) {
    speechToText();
    recording = true;
  } else {
    stopRecording();
  }
});

function stopRecording() {
  if (recording){
    recognition.stop();
  }
  recordBtn.querySelector("p").innerHTML = "Start Listening";
  recordBtn.classList.remove("recording");
  recording = false;
}

downloadBtn.addEventListener("click", async () => {
  downloadBtn.disabled = true;
  wiki.innerHTML = "-LOADING TITLE-";
  result.innerHTML = "";
  while (texts.firstChild) {
    texts.removeChild(texts.firstChild);
  }
  correct.innerHTML = "Title has not been spoken yet."
  changeColor("red");
  clearBtn.disabled = true;
  stopRecording();
  recordBtn.disabled = false;
  await getWiki();
  downloadBtn.disabled = false;
});

async function getWiki() {
  const url = "https://en.wikipedia.org/w/api.php?origin=*&format=json&action=query&generator=random&grnnamespace=0&prop=revisions|images&rvprop=content&grnlimit=1";
  const data = await fetch(url);
  if (!data.ok) {
    const message = `An error has occured: ${data.status}`;
    alert(`Wikipedia API error: ${data.status}, try reloading the page or try again later.`);
    throw new Error(message);
  }
  const res = await data.json();
  getTitle(res);
}

clearBtn.addEventListener("click", () => {
  const text = result.innerText;
  if (text.toLowerCase().replace(/\s+/g, '').includes(correct_title)) {
    stopRecording();
    correct.innerHTML = "Title has been spoken!";
    changeColor("green");
    recordBtn.disabled = true;
    clearBtn.disabled = true;
  } else {
    let p = document.createElement("p");
    p.innerText = text;
    texts.insertBefore(p, texts.firstChild);
    p = document.createElement("p");;
    result.innerHTML = "";
    clearBtn.disabled = true;
  }
});

function getTitle(data) {
  let pages = data.query.pages;
  let firstKey = Object.keys(pages)[0];
  let title = pages[firstKey].title.replace(/ *\([^)]*\) */g, "");
  correct_title = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s+/g, '');
  wiki.innerHTML = title;
  return false;
}

async function init() {
  await getWiki();
  downloadBtn.disabled = false;
}

init();