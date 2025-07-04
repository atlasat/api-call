import io from "socket.io-client";
import * as fs from "fs";
import "dotenv/config";

const audio = [
  // {
  //   format: "mp3",
  //   total: 9, //10
  //   extension: "mp3",
  //   chunks: [],
  // },
  // {
  //   format: "alaw",
  //   total: 9,
  //   extension: "alaw",
  //   chunks: [],
  // },
  // {
  //   format: "mulaw",
  //   total: 9,
  //   extension: "mulaw",
  //   chunks: [],
  // },
  {
    format: "pcm16",
    total: 180,
    extension: "pcm",
    chunks: [],
  },
];

const filePath = "./audio/mp3/chandra.mp3"; // ganti dengan path file kamu
const bufferSize = 1024 * 5;
const buffer = Buffer.alloc(bufferSize);

const buildAudio = () => {
  return [
    ...audio.map((item) => ({
      ...item,
      chunks: Array.from({ length: item.total }, (_, i) => i).map((chunk) =>
        fs.readFileSync(
          `./audio/${item.format}/output_${String(chunk).padStart(3, "0")}.${
            item.extension
          }`
        )
      ),
    })),
  ];
};

//const getAllAudio = buildAudio();
const playAudio = (audio, callback) => {
  if (audio.length === 0) return;

  const format = audio[0];
  if (!format || format.chunks.length === 0) {
    audio.shift();
    playAudio(audio, callback);
    return;
  }

  const chunk = format.chunks.shift();
  callback(
    format.format,
    `label ${format.format} ${format.total - format.chunks.length}`,
    chunk,
    () => {
      playAudio(audio, callback);
    }
  );
};

const socket = io(process.env.SOCKET_SERVER, {
  reconnectionDelayMax: 10000,
  transports: ["websocket"],
  auth: {
    token: process.env.API_KEY,
  },
});

socket.on("connect", () => {
  console.log(socket.id); // "G5p5..."
});

let sessionId;
let allAudioSession = {};
socket.on("newSession", (data) => {
  allAudioSession[data.sessionId] = buildAudio();
  console.log("newSession", data);
  socket.emit("joinRoom", { sessionId: data.sessionId });
  sessionId = data.sessionId;
});

socket.on("roomJoined", (data) => {
  console.log("room joined", data);
});

socket.on("checkPoint", (data) => {
  console.log("checkPoint", data);
});

socket.on("dtmf", (data) => {
  console.log("dtmf", data);
});

socket.on("hangup", (data) => {
  console.log("hangup call", data);
});

socket.on("dialStatus", async (status) => {
  console.log("dial status", status);
  if (status.status === "Connected") {
    // await new Promise((resolve) => {
    //   setTimeout(resolve, 1000);
    // });

    //return;

    socket.emit("checkPoint", {
      sessionId: status.sessionId,
      name: "started initial " + new Date().toISOString(),
    });

    setTimeout(() => {
      socket.emit("dtmf", {
        sessionId: status.sessionId,
        digit: "5",
        duration: 200,
      });
    }, 3000);

    let i = 0;
    playAudio(
      allAudioSession[status.sessionId],
      (format, label, audioBuffer, next) => {
        // console.log("play", label);
        socket.emit(
          "audio",
          {
            sessionId: status.sessionId,
            audioData: audioBuffer,
            audioFormat: format,
          },
          (ack) => {
            //console.log("ack", ack);
            //next();
          }
        );

        setTimeout(next, 100);
        i++;
      }
    );
  }
});

socket.on("connect_error", (err) => {
  console.log(err); // prints the message associated with the error
});

socket.on("error", (data) => {
  console.log("error: ", data);
});

socket.on("audio", (data) => {
  return;
  socket.emit(
    "audio",
    {
      sessionId: data.sessionId,
      audioData: data.audioData,
      audioFormat: "pcm16",
    },
    (ack) => {
      //console.log("ack", ack);
    }
  );
});
