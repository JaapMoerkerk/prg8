import { ChatOpenAI } from "@langchain/openai";
import express from 'express';
import * as dotenv from "dotenv";
import cors from 'cors';
import bodyParser from "body-parser";

const serverPort = 3095;

dotenv.config();

const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY
});

const app = express();

app.use(bodyParser.json());

app.use(cors());

app.post('/generate', async (req, res) => {
    try {
        //Getting the array 'inputList' from the TripTrove call
        const { inputList } = req.body;
        // Input list (array of strings) is joined as one string prompt
        const response = await model.invoke(inputList.join(' '));
        // Send the response back to the front end
        res.json({ content: response.content });
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(serverPort, () =>{
    console.log(`Server is running on http://localhost:${serverPort}`);
});