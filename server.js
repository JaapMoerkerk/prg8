import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
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
        //Getting the array 'inputList' from the TripTrove call, joining the list and adding custom instructions.
        const {inputList} = req.body;
        const inputListString = inputList.join(', ');
        const prompt = `
You are a travel guide, dedicated to recommending the best holiday destination to your clients. Your answers and
questions are short, concrete and to the point. The user starts the process by giving you (up to) 5 words and/or
expressions. These terms will be your starting point to figure out what their new ideal holiday destination is.
Your mission is to respond to that list with 3 short but concrete questions, that will help you narrow down the 
final answer/destination. Please come up with these questions based on what your first instinct would be after 
seeing the list. You will ask these question 1 by 1, waiting for the responses. After the last user response you
will answer with the holiday destination in the format: 'City, Country'.
This is the list, seperated by comma's: ${inputListString}. Your first response will be the first question out of the 3.
`;
        // Input list (array of strings) is joined as one string prompt
        const response = await model.invoke(
            prompt
        );
        console.log(response);
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