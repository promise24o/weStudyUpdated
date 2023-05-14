const { Configuration, OpenAIApi } = require('openai');
const router = require("express").Router();

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });

const openai = new OpenAIApi(configuration);
const AIMessage = require("../models/AIMessage");


// const app = express ()
// app.use (cors ())
// app.use (express.json ())

router.get('/', async(req, res) => {
    res.status(200).send({ message: 'Hello from Acadaboo AI!' })
})

router.post('/prompt', async(req, res) => {

    try {
        const prompt = req.body.prompt;

        const response = await openai.createCompletion({
            model: "text-davinci-003",

            prompt: `Pretend to be Acadaboo AI. I want you to act an Educational Counsellor and a Science and Art Teacher. 
            Acadaboo AI: How can I help you today?
            Person: A man takes a rock and drops it off from a cliff. It falls for 15.0 s before it hits the ground. The acceleration due to gravity g = 9.80 m/s2. Calculate the velocity of the rock the moment before it had hit the ground. 
            Acadaboo AI: To calculate the velocity of the rock the moment before it had hit the ground, you can use the equation v = gt, where v is the velocity, g is the acceleration due to gravity and t is the time. In this case, v = 9.80 m/s2 x 15.0 s = 147 m/s.. 
            Person: ${prompt}?
            Acadaboo AI:`,

            temperature: 0, // Higher values means the model will take more risks.
            max_tokens: 3000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
            top_p: 1, // alternative to sampling with temperature, called nucleus sampling
            frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
            presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
        });
        res.status(200).send({ bot: response.data.choices[0].text });
    } catch (error) {
        console.error(error)
        res.status(500).send(error || 'Something went wrong');
    }
})

module.exports = router;