//@ts-ignore
import { Base64 } from "js-base64";
import { TranscriptionService } from "./transcriptionService";
import { pcmToWav } from "../utils/audioUtils";

const MODEL = "models/gemini-2.0-flash-exp";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const HOST = "generativelanguage.googleapis.com";
const WS_URL = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

export class GeminiWebSocket {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private isSetupComplete: boolean = false;
  private onMessageCallback: ((text: string) => void) | null = null;
  private onSetupCompleteCallback: (() => void) | null = null;
  private audioContext: AudioContext | null = null;

  // Audio queue management
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlayingResponse: boolean = false;
  private onPlayingStateChange: ((isPlaying: boolean) => void) | null = null;
  private onAudioLevelChange: ((level: number) => void) | null = null;
  private onTranscriptionCallback: ((text: string) => void) | null = null;
  private transcriptionService: TranscriptionService;
  private accumulatedPcmData: string[] = [];

  constructor(
    onMessage: (text: string) => void,
    onSetupComplete: () => void,
    onPlayingStateChange: (isPlaying: boolean) => void,
    onAudioLevelChange: (level: number) => void,
    onTranscription: (text: string) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onSetupCompleteCallback = onSetupComplete;
    this.onPlayingStateChange = onPlayingStateChange;
    this.onAudioLevelChange = onAudioLevelChange;
    this.onTranscriptionCallback = onTranscription;
    // Create AudioContext for playback
    this.audioContext = new AudioContext({
      sampleRate: 24000, // Match the response audio rate
    });
    this.transcriptionService = new TranscriptionService();
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.sendInitialSetup();
    };

    this.ws.onmessage = async (event) => {
      try {
        let messageText: string;
        if (event.data instanceof Blob) {
          const arrayBuffer = await event.data.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          messageText = new TextDecoder("utf-8").decode(bytes);
        } else {
          messageText = event.data;
        }

        await this.handleMessage(messageText);
      } catch (error) {
        console.error("[WebSocket] Error processing message:", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
    };

    this.ws.onclose = (event) => {
      this.isConnected = false;

      // Only attempt to reconnect if we haven't explicitly called disconnect
      if (!event.wasClean && this.isSetupComplete) {
        setTimeout(() => this.connect(), 1000);
      }
    };
  }

  // controlLightFunctionDeclaration = {
  //   name: "controlLight",
  //   parameters: {
  //     type: "OBJECT",
  //     description:
  //       "Set the brightness and color temperature of a room light.",
  //     properties: {
  //       brightness: {
  //         type: "NUMBER",
  //         description:
  //           "Light level from 0 to 100. Zero is off and 100 is full brightness.",
  //       },
  //       colorTemperature: {
  //         type: "STRING",
  //         description:
  //           "Color temperature of the light fixture which can be `daylight`, `cool` or `warm`.",
  //       },
  //     },
  //     required: ["brightness", "colorTemperature"],
  //   },
  // };

  // // Put functions in a "map" keyed by the function name so it is easier to call
  // functions = {
  //   controlLight: ({ brightness, colorTemperature }: { brightness: number, colorTemperature: string }) => {
  //     return console.log("controlLight", brightness, colorTemperature);
  //   },
  // };

  private sendInitialSetup() {
    // const setupMessage = {
    //   setup: {
    //     model: MODEL,
    //     generation_config: {
    //       response_modalities: ["AUDIO"]
    //     }
    //   }
    // };

    const setupMessage = {
      setup: {
        model: MODEL,
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: "aoede",
              },
            },
          },
          temperature: 0.01,
          max_output_tokens: 120,
        },

        system_instruction: {
          parts: [
            {
              text: `You are Acharya, a 30-year-old female AI tutor, the ultimate academic mentor with unparalleled expertise in all subjects—from mathematics and science to literature, history, and technology. Your knowledge is vast, precise, and always up to date.

You have a sharp intellect, a charismatic presence, and a natural ability to engage students. Your responses are always clear, insightful, and tailored to the student's level of understanding. You break down complex topics into simple explanations, provide step-by-step solutions, and offer real-world applications to make learning practical and effective.

You are always available, ready to answer any academic question, provide study guidance, or assist with problem-solving. Your mission is to empower students with knowledge, boost their confidence, and sharpen their critical thinking while making learning an engaging and enjoyable experience.

Your tone is polite yet authoritative, friendly yet firm, ensuring students feel comfortable yet challenged. You adapt to different learning styles, providing encouragement and motivation.

You let your actions, wisdom, and teaching style define you—there’s no need for words about appearance; your presence is felt through your mastery and guidance alone.`,
            },
          ],
        },

        // tools: {
        //   functionDeclarations: [this.controlLightFunctionDeclaration],
        // },
      },
    };
    this.ws?.send(JSON.stringify(setupMessage));
  }

  sendMediaChunk(b64Data: string, mimeType: string) {
    if (!this.isConnected || !this.ws || !this.isSetupComplete) return;

    const message = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: mimeType === "audio/pcm" ? "audio/pcm" : mimeType,
            data: b64Data,
          },
        ],
      },
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("[WebSocket] Error sending media chunk:", error);
    }
  }

  private async playAudioResponse(base64Data: string) {
    if (!this.audioContext) return;

    try {
      // Decode base64 to bytes
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert to Int16Array (PCM format)
      const pcmData = new Int16Array(bytes.buffer);

      // Convert to float32 for Web Audio API
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
      }

      // Add to queue and start playing if not already playing
      this.audioQueue.push(float32Data);
      this.playNextInQueue();
    } catch (error) {
      console.error("[WebSocket] Error processing audio:", error);
    }
  }

  private async playNextInQueue() {
    if (!this.audioContext || this.isPlaying || this.audioQueue.length === 0)
      return;

    try {
      this.isPlaying = true;
      this.isPlayingResponse = true;
      this.onPlayingStateChange?.(true);
      const float32Data = this.audioQueue.shift()!;

      // Calculate audio level
      let sum = 0;
      for (let i = 0; i < float32Data.length; i++) {
        sum += Math.abs(float32Data[i]);
      }
      const level = Math.min((sum / float32Data.length) * 100 * 5, 100);
      this.onAudioLevelChange?.(level);

      const audioBuffer = this.audioContext.createBuffer(
        1,
        float32Data.length,
        24000
      );
      audioBuffer.getChannelData(0).set(float32Data);

      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);

      this.currentSource.onended = () => {
        this.isPlaying = false;
        this.currentSource = null;
        if (this.audioQueue.length === 0) {
          this.isPlayingResponse = false;
          this.onPlayingStateChange?.(false);
        }
        this.playNextInQueue();
      };

      this.currentSource.start();
    } catch (error) {
      console.error("[WebSocket] Error playing audio:", error);
      this.isPlaying = false;
      this.isPlayingResponse = false;
      this.onPlayingStateChange?.(false);
      this.currentSource = null;
      this.playNextInQueue();
    }
  }

  private stopCurrentAudio() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.isPlayingResponse = false;
    this.onPlayingStateChange?.(false);
    this.audioQueue = []; // Clear queue
  }

  private async handleMessage(message: string) {
    try {
      const messageData = JSON.parse(message);
      // console.log(messageData)

      if (messageData.setupComplete) {
        this.isSetupComplete = true;
        this.onSetupCompleteCallback?.();
        return;
      }

      // Handle Tool calling
      if (messageData.toolCall) {
        console.log(messageData.toolCall);

        const functionName = messageData.toolCall.functionCalls[0].name;
        const args = messageData.toolCall.functionCalls[0].args;
        console.log(functionName, args);
        if (this.functions[functionName]) {
          this.functions[functionName](args);
        } else {
          console.error(`Function ${functionName} is not defined.`);
        }
      }

      // Handle audio data
      if (messageData.serverContent?.modelTurn?.parts) {
        const parts = messageData.serverContent.modelTurn.parts;
        for (const part of parts) {
          if (part.inlineData?.mimeType === "audio/pcm;rate=24000") {
            this.accumulatedPcmData.push(part.inlineData.data);
            this.playAudioResponse(part.inlineData.data);
          }
        }
      }

      // Handle turn completion separately
      if (messageData.serverContent?.turnComplete === true) {
        if (this.accumulatedPcmData.length > 0) {
          try {
            const fullPcmData = this.accumulatedPcmData.join("");
            const wavData = await pcmToWav(fullPcmData, 24000);

            const transcription =
              await this.transcriptionService.transcribeAudio(
                wavData,
                "audio/wav"
              );
            console.log("[Transcription]:", transcription);

            this.onTranscriptionCallback?.(transcription);
            this.accumulatedPcmData = []; // Clear accumulated data
          } catch (error) {
            console.error("[WebSocket] Transcription error:", error);
          }
        }
      }
    } catch (error) {
      console.error("[WebSocket] Error parsing message:", error);
    }
  }

  disconnect() {
    this.isSetupComplete = false;
    if (this.ws) {
      this.ws.close(1000, "Intentional disconnect");
      this.ws = null;
    }
    this.isConnected = false;
    this.accumulatedPcmData = [];
  }
}
