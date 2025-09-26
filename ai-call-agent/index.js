import Fastify from "fastify";
import WebSocket from "ws";
import dotenv from "dotenv";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import Twilio from "twilio";

dotenv.config();

const {
  ELEVENLABS_AGENT_ID,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = process.env;

// Check for the required environment variables
if (!ELEVENLABS_AGENT_ID || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error("Missing required environment variables");
  process.exit(1);
}

// Initialize Fastify server
const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

// Initialize Twilio client
const twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const PORT = process.env.PORT || 8080;

// Root route for health check
fastify.get("/", async (_, reply) => {
  reply.send({ message: "Server is running" });
});

// Initial conversation script for the AI agent
const initialScript = {
  type: "text",
  text: "Hello, this is an automated call. We've detected an issue during system testing. I have three possible solutions for you: Option 1: Restart the application and clear cache. Option 2: Update the system to the latest version. Option 3: Run a diagnostic repair tool. Please say the number of the option you'd like to choose, or ask me which solution I recommend."
};

// Route to handle incoming calls from Twilio
fastify.all("/incoming-call-eleven", async (request, reply) => {
  // Generate TwiML response to connect the call to a WebSocket stream
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="wss://${request.headers.host}/media-stream" />
      </Connect>
    </Response>`;

  reply.type("text/xml").send(twimlResponse);
});

// WebSocket route for handling media streams from Twilio
fastify.register(async (fastifyInstance) => {
  fastifyInstance.get("/media-stream", { websocket: true }, (connection, req) => {
    console.info("[Server] Twilio connected to media stream.");

    let streamSid = null;
    let conversationState = {
      started: false,
      waitingForUserResponse: false,
      userResponseReceived: false
    };

    // Connect to ElevenLabs Conversational AI WebSocket
    const elevenLabsWs = new WebSocket(
      `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}`
    );

    elevenLabsWs.on("open", () => {
      console.log("[II] Connected to Conversational AI.");
    });

    elevenLabsWs.on("message", (data) => {
      try {
        const message = JSON.parse(data);
        handleElevenLabsMessage(message, connection);
      } catch (error) {
        console.error("[II] Error parsing message:", error);
      }
    });

    elevenLabsWs.on("error", (error) => {
      console.error("[II] WebSocket error:", error);
    });

    elevenLabsWs.on("close", () => {
      console.log("[II] Disconnected.");
    });

    const handleElevenLabsMessage = (message, connection) => {
      switch (message.type) {
        case "conversation_initiation_metadata":
          console.info("[II] Received conversation initiation metadata.");
          
          // Start the conversation with our initial script once connected
          if (!conversationState.started) {
            elevenLabsWs.send(JSON.stringify(initialScript));
            conversationState.started = true;
            conversationState.waitingForUserResponse = true;
            console.log("[II] Sent initial script to agent.");
          }
          break;
        case "audio":
          if (message.audio_event?.audio_base_64) {
            const audioData = {
              event: "media",
              streamSid,
              media: {
                payload: message.audio_event.audio_base_64,
              },
            };
            connection.send(JSON.stringify(audioData));
          }
          break;
        case "text":
          // Log the text response from the agent
          if (message.text_event?.text) {
            console.log(`[II] Agent response: ${message.text_event.text}`);
            
            // After agent responds to the user's choice, mark the conversation as completed
            if (conversationState.userResponseReceived) {
              console.log("[II] Agent provided recommendation response.");
            }
          }
          break;
        case "interruption":
          connection.send(JSON.stringify({ event: "clear", streamSid }));
          break;
        case "ping":
          if (message.ping_event?.event_id) {
            const pongResponse = {
              type: "pong",
              event_id: message.ping_event.event_id,
            };
            elevenLabsWs.send(JSON.stringify(pongResponse));
          }
          break;
      }
    };

    connection.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        switch (data.event) {
          case "start":
            streamSid = data.start.streamSid;
            console.log(`[Twilio] Stream started with ID: ${streamSid}`);
            break;
          case "media":
            if (elevenLabsWs.readyState === WebSocket.OPEN) {
              const audioMessage = {
                user_audio_chunk: Buffer.from(data.media.payload, "base64").toString("base64"),
              };
              elevenLabsWs.send(JSON.stringify(audioMessage));
              
              // If we're waiting for a user response, mark that we've received it
              if (conversationState.waitingForUserResponse && !conversationState.userResponseReceived) {
                console.log("[Twilio] User response received.");
                conversationState.userResponseReceived = true;
              }
            }
            break;
          case "mark":
            // Handle DTMF (dial pad) input for option selection
            if (data.mark.name === "dtmf") {
              const dtmfDigit = data.mark.value;
              console.log(`[Twilio] User pressed: ${dtmfDigit}`);
              
              if (conversationState.waitingForUserResponse) {
                let response;
                
                // Map DTMF input to text command for ElevenLabs
                switch (dtmfDigit) {
                  case "1":
                    response = { type: "text", text: "I choose option 1" };
                    break;
                  case "2":
                    response = { type: "text", text: "I choose option 2" };
                    break;
                  case "3":
                    response = { type: "text", text: "I choose option 3" };
                    break;
                  default:
                    return; // Ignore other digits
                }
                
                elevenLabsWs.send(JSON.stringify(response));
                conversationState.userResponseReceived = true;
              }
            }
            break;
          case "stop":
            elevenLabsWs.close();
            break;
          default:
            console.log(`[Twilio] Received unhandled event: ${data.event}`);
        }
      } catch (error) {
        console.error("[Twilio] Error processing message:", error);
      }
    });

    connection.on("close", () => {
      elevenLabsWs.close();
      console.log("[Twilio] Client disconnected");
    });

    connection.on("error", (error) => {
      console.error("[Twilio] WebSocket error:", error);
      elevenLabsWs.close();
    });
  });
});

// Route to initiate an outbound call
// fastify.post("/make-outbound-call", async (request, reply) => {
//   const { to } = request.body; // Destination phone number

//   if (!to) {
//     return reply.status(400).send({ error: "Destination phone number is required" });
//   }

//   try {
//     const call = await twilioClient.calls.create({
//       url: `https://${request.headers.host}/incoming-call-eleven`, // Webhook for call handling
//       to: to,
//       from: TWILIO_PHONE_NUMBER,
//     });

//     console.log(`[Twilio] Outbound call initiated: ${call.sid}`);
//     reply.send({ message: "Call initiated", callSid: call.sid });
//   } catch (error) {
//     console.error("[Twilio] Error initiating call:", error);
//     reply.status(500).send({ error: "Failed to initiate call" });
//   }
// });

// Route to initiate outbound call
fastify.post("/make-outbound-call", async (request, reply) => {
  const { to } = request.body; // Destination phone number
  
  if (!to) {
    return reply.status(400).send({ error: "Destination phone number is required" });
  }
  
  try {
    const call = await twilioClient.calls.create({
      url: `https://${request.headers.host}/incoming-call-eleven`, // Webhook for call handling
      to: to,
      from: TWILIO_PHONE_NUMBER,
      statusCallback: `https://${request.headers.host}/call-status`, // Webhook for call status updates
      statusCallbackEvent: ['completed'], // Only trigger when call completes
    });
    
    console.log(`[Twilio] Outbound call initiated: ${call.sid}`);
    
    reply.send({ message: "Call initiated", callSid: call.sid });
  } catch (error) {
    console.error("[Twilio] Error initiating call:", error);
    reply.status(500).send({ error: "Failed to initiate call" });
  }
});

// Webhook to handle call status updates
fastify.post("/call-status", async (request, reply) => {
  const { CallStatus, CallSid } = request.body;
  
  console.log(`[Twilio] Call ${CallSid} status: ${CallStatus}`);
  
  if (CallStatus === 'completed') {
    try {
      // Make POST request to /send endpoint after call ends
      await fetch(`https://${request.headers.host}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      console.log(`[Twilio] POST to /send triggered after call ${CallSid} completed`);
    } catch (error) {
      console.error("[Twilio] Error calling /send endpoint:", error);
    }
  }
  
  reply.send({ received: true });
});

// Start the Fastify server
fastify.listen({ port: PORT }, (err) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
  console.log(`[Server] Listening on port ${PORT}`);
});