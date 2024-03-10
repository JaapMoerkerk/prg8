import { ChatOpenAI } from "@langchain/openai";
import express from 'express';
import * as dotenv from "dotenv";
import cors from 'cors';
import bodyParser from "body-parser";
import fetch from 'node-fetch';

dotenv.config();

const serverPort = 3095;
const app = express();
const chatHistories = new Map(); // Store chat history for each session

app.use(bodyParser.json());
app.use(cors());

const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY
});

app.post('/generate', async (req, res) => {
    try {
        const { inputList, chatInput, sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        // Initialize chat history for new sessions
        if (!chatHistories.has(sessionId)) {
            chatHistories.set(sessionId, []);
        }

        let prompt = "";
        const chatHistory = chatHistories.get(sessionId);

        if (inputList) {
            const inputListString = inputList.join(', ');
            prompt += `
You are a travel agent. Based on the following 5 words/short expressions, seperated by commas: ${inputListString}, generate a holiday destination in the format '[CITY], [COUNTRY]. You are not allowed
to give any other information for this first response than a city and country in that format. After that first response there might be questions from the user, if there are, you will see them below
in this prompt, otherwise you can assume that this is the first response. Those questions can be answered like a travel agent, you know nothing else than travel information.
`;
        } else if (chatInput) {
            // Append the new user input to the chat history
            chatHistory.push(`User: ${chatInput}`);
        }

        // Add previous conversation context to the prompt
        chatHistory.forEach(line => {
            prompt += `${line}\n`;
        });

        const response = await model.invoke(prompt);

        // Append the new AI response to the chat history
        chatHistory.push(`AI: ${response.content}`);
        chatHistories.set(sessionId, chatHistory);

        res.json({ content: response.content });
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/weather', async (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId || !chatHistories.has(sessionId)) {
        return res.status(400).json({ error: 'Valid session ID is required' });
    }

    const chatHistory = chatHistories.get(sessionId);
    // Assuming the first response is always the destination in 'City, Country' format
    const destination = chatHistory.find(line => line.startsWith('AI:')).replace('AI: ', '');

    if (!destination) {
        return res.status(404).json({ error: 'Destination not found in session.' });
    }

    const [city, country] = destination.split(', '); // Adjust as necessary based on your exact format
    const weatherInfo = await fetchWeatherData(city, country);

    if (!weatherInfo) {
        return res.status(500).json({ error: 'Failed to fetch weather information.' });
    }

    const descriptiveText = await generateWeatherDescription(weatherInfo);
    res.json({ content: descriptiveText });
});

async function fetchWeatherData(city, country) {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY; // Replace with your actual OpenWeatherMap API key
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        // Simplify the data structure or adjust according to your needs
        return {
            temperature: data.main.temp,
            description: data.weather[0].description
        };
    } catch (error) {
        console.error("Error fetching weather data:", error);
        return null;
    }
}

async function generateWeatherDescription(weatherInfo) {
    const prompt = `The weather in the destination is ${weatherInfo.temperature} degrees Celsius with ${weatherInfo.description}. Write two sentences to describe this weather situation.`;

    try {
        const response = await model.invoke(prompt);
        return response.content; // Assuming this returns the descriptive text directly
    } catch (error) {
        console.error("Error generating weather description:", error);
        return "Unable to generate weather description.";
    }
}

app.listen(serverPort, () => {
    console.log(`Server is running succesfully on the Render domain.`);
});
