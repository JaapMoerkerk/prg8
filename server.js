import { ChatOpenAI } from "@langchain/openai";
import express from 'express';
import * as dotenv from "dotenv";

dotenv.config();

console.log("testing....")
console.log(process.env.OPENAI_API_KEY)


const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY
});


const app = express();

app.get('/', async (req, res) => {
    const joke = await model.invoke("Vertel me een grapje over Sander, hij is erg onzeker over zijn programmeerskills.");
    res.send(joke.content);
});

app.listen(3000, () =>{
    console.log('Server is running on http://localhost:3000');
});
