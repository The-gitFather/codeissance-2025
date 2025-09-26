# AI Agent Outbound Calls with ElevenLabs and Twilio

## Overview
This repository enables AI-powered outbound calls using ElevenLabs voice agents and Twilio. The system leverages ElevenLabs for text-to-speech (TTS) conversion and Twilio for making outbound calls.

## Setup Instructions

### Prerequisites
Ensure you have the following:
- **Node.js** installed
- **Ngrok** installed for tunneling
- A **Twilio** account with a verified phone number
- An **ElevenLabs** API key and Agent ID

### Installation
1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd <repo-folder>
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up your `.env` file with the required credentials:
   ```sh
   ELEVENLABS_AGENT_ID=<your-elevenlabs-agent-id>
   TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
   TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
   TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
   ```

### Running the Server
1. Start the server:
   ```sh
   node index.js
   ```
2. Expose port `8000` using ngrok:
   ```sh
   ngrok http 8000
   ```
   Copy the generated `https://<ngrok-subdomain>.ngrok.io` URL.

### Making an Outbound Call
Use any HTTP client(postman, curl, thunder client, etc.) to make an outbound call to the server.
```
POST https://<ngrok-subdomain>.ngrok.io/make-outbound-call
```
With the following JSON body:
```json
{
  "to": "<recipient-phone-number>"
}
```
*Ensure the recipient phone number is verified on Twilio.*

## Important Configurations
### ElevenLabs Settings
- **TTS Output Format**: Set to `μ-law 8000 Hz`.
- **User Audio Input Format**: Set to `μ-law 8000 Hz`.

### Precautions
- Verify that all `.env` variables are correctly set before running the application.
- Ensure the recipient phone number is **verified in Twilio** before making calls.
- Keep your **Twilio Auth Token** and **ElevenLabs API credentials** secure.

## License
This project is open-source. Feel free to modify and improve it!

